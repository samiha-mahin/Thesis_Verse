const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const SupervisorProfile = require('../models/SupervisorProfile');
const Journal = require('../models/Journal');
const Template = require('../models/Template');
const Guideline = require('../models/Guideline');
const {
  initialSupervisors,
  initialGuidelines,
  initialTemplates,
  initialJournals
} = require('../config/seed');

/**
 * Call real Google Gemini AI with resilient model fallback cascade.
 * Avoids 503 capacity issues by prioritizing highly available models like gemini-3.5-flash.
 */
async function callGemini(userQuery, systemInstruction) {
  require('dotenv').config();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim() || apiKey.trim() === 'your_gemini_api_key_here') {
    return null;
  }

  const cleanKey = apiKey.trim();
  // gemini-3.5-flash is ultra-fast, active, and avoids the 503 high-demand spike of 3.8-flash
  const models = [
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];
  const genAI = new GoogleGenerativeAI(cleanKey);

  // 1. Try with GoogleGenerativeAI SDK with per-model timeout
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
      });

      // Wrap in 12s timeout to avoid long hanging calls
      const generatePromise = model.generateContent(userQuery);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${modelName}`)), 12000)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const text = result?.response?.text();
      if (text && text.trim()) {
        return { text: text.trim(), model: modelName, source: 'gemini-sdk' };
      }
    } catch (err) {
      console.warn(`[Gemini AI SDK] Model ${modelName} error:`, err.message);
      // Automatically fall through to next model if 503, 404, or timeout occurs
    }
  }

  // 2. Direct REST API fallback if SDK encountered issues
  for (const modelName of models.slice(0, 3)) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate && candidate.trim()) {
          return { text: candidate.trim(), model: modelName, source: 'gemini-rest' };
        }
      }
    } catch (err) {
      console.warn(`[Gemini AI REST] Model ${modelName} error:`, err.message);
    }
  }

  return null;
}

/**
 * Safely fetch contextual data from MongoDB or instant seed fallback
 */
async function getContextData() {
  if (mongoose.connection.readyState === 1) {
    try {
      const queryPromise = Promise.all([
        SupervisorProfile.find({}).lean(),
        Guideline.find({}).lean(),
        Template.find({}).lean(),
        Journal.find({}).lean()
      ]);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Mongo query timeout')), 1500)
      );

      const [supervisors, guidelines, templates, journals] = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      return {
        supervisors: supervisors.length ? supervisors : initialSupervisors,
        guidelines: guidelines.length ? guidelines : initialGuidelines,
        templates: templates.length ? templates : initialTemplates,
        journals: journals.length ? journals : initialJournals
      };
    } catch (e) {
      // Fall through to seeds
    }
  }

  return {
    supervisors: initialSupervisors,
    guidelines: initialGuidelines,
    templates: initialTemplates,
    journals: initialJournals
  };
}

/**
 * Check Gemini AI status
 * @route   GET /api/chat/status
 * @access  Public
 */
exports.getChatStatus = async (req, res) => {
  try {
    require('dotenv').config();
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey.trim() && apiKey.trim() !== 'your_gemini_api_key_here');

    res.json({
      ok: true,
      geminiEnabled: isConfigured,
      model: isConfigured ? 'gemini-3.5-flash' : 'rule_based_fallback',
      provider: 'Google Gemini AI',
      status: isConfigured ? 'active' : 'needs_api_key'
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * Dynamic AI thesis assistant chatbot query powered by Google Gemini AI
 * @route   POST /api/chat
 * @access  Public
 */
exports.handleChat = async (req, res) => {
  try {
    const { text = '' } = req.body;
    const clean = text.trim();
    if (!clean) {
      return res.status(400).json({ ok: false, error: 'Query text is required' });
    }

    const lower = clean.toLowerCase();

    // 1. Fetch live contextual data (fast with instant seed fallback)
    const { supervisors, guidelines, templates, journals } = await getContextData();

    // Match potential recommendations from DB to enrich response with interactive cards
    let recommendation = null;
    let journalLink = null;

    // Check matching supervisor
    const matchedSup = supervisors.find((s) => {
      const matchName = s.name.toLowerCase().includes(lower);
      const matchBio = (s.bio || '').toLowerCase().includes(lower);
      const matchTags = (s.tags || []).some(
        (t) => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower)
      );
      return matchName || matchBio || matchTags;
    });

    if (matchedSup) {
      recommendation = {
        name: matchedSup.name,
        designation: `${matchedSup.designation}, ${matchedSup.department}`,
        papers: `${matchedSup.papers || 0} Research Papers`,
        link: '#supervisors'
      };
    }

    // Check matching journal or template
    if (
      lower.includes('ieee') ||
      lower.includes('journal') ||
      lower.includes('paper') ||
      lower.includes('scopus') ||
      lower.includes('sciencedirect')
    ) {
      const matchedJournal =
        journals.find(
          (j) =>
            lower.includes(j.shortCode.toLowerCase()) ||
            lower.includes(j.name.toLowerCase())
        ) || journals[0];

      if (matchedJournal) {
        journalLink = {
          title: matchedJournal.name,
          url: matchedJournal.searchUrl || 'https://ieeexplore.ieee.org'
        };
      }
    } else if (
      lower.includes('latex') ||
      lower.includes('overleaf') ||
      lower.includes('template') ||
      lower.includes('word') ||
      lower.includes('slides')
    ) {
      const matchedTemplate = templates.find((t) => t.hasOverleafLink) || templates[0];
      if (matchedTemplate) {
        journalLink = {
          title: matchedTemplate.title,
          url: '#templates'
        };
      }
    } else if (
      lower.includes('defense') ||
      lower.includes('rubric') ||
      lower.includes('proposal') ||
      lower.includes('pre-defense')
    ) {
      journalLink = {
        title: '3-Stage Defense Rubrics',
        url: '#guidelines'
      };
    }

    // 2. Prepare comprehensive system instruction for Google Gemini AI
    const supervisorListStr = supervisors
      .slice(0, 15)
      .map(
        (s) =>
          `• ${s.name} (${s.designation}, ${s.department}): Specializations: ${(s.tags || []).join(', ')}. Papers: ${s.papers || 0}, Open Slots: ${s.openSlots || 0}. Email: ${s.email}.`
      )
      .join('\n');

    const guidelinesStr = guidelines
      .slice(0, 6)
      .map((g) => `• ${g.title}: ${g.description}`)
      .join('\n');

    const templatesStr = templates
      .slice(0, 5)
      .map((t) => `• ${t.title} (${t.formatBadge}): ${t.description}`)
      .join('\n');

    const systemInstruction = `You are the official IIUC ThesisVerse AI Academic Research Assistant for the International Islamic University Chittagong (IIUC).
You guide students and faculty across the Department of Computer Science & Engineering (CSE) and Department of Electrical & Electronic Engineering (EEE).

VERIFIED IIUC FACULTY SUPERVISORS DIRECTORY:
${supervisorListStr}

OFFICIAL IIUC THESIS GUIDELINES & 3-STAGE DEFENSE EVALUATION:
- Proposal Defense (30% weight): Problem definition, literature review (last 3-5 years), methodology feasibility, initial slide presentation.
- Pre-Defense (20% weight): 60-70% implementation completion, preliminary results, report structure review.
- Final Defense (50% weight): Final report formatting, plagiarism check, benchmark comparison, examination board Q&A, publication.
${guidelinesStr}

DOWNLOADABLE THESIS TEMPLATES:
${templatesStr}

BEHAVIORAL INSTRUCTIONS:
1. Provide warm, academically rigorous, concise, and structured answers (use bold text and bullet points where helpful).
2. When answering questions regarding research domains (e.g., NLP, Machine Learning, Computer Vision, IoT, Power Systems, Blockchain, Cybersecurity), cite relevant professors from the verified IIUC supervisors list above.
3. When answering about defense, explain the 3-Stage evaluation process clearly.
4. When answering about formats, point to the official Word / Overleaf LaTeX templates.
5. Answer in English or Bengali depending on the user query language. Keep answers under 3-4 paragraphs so it fits comfortably in a chat widget.`;

    // 3. Call real Gemini AI
    const geminiResult = await callGemini(clean, systemInstruction);

    if (geminiResult && geminiResult.text) {
      return res.json({
        ok: true,
        response: {
          id: Date.now(),
          sender: 'bot',
          text: geminiResult.text,
          aiModel: geminiResult.model,
          poweredBy: 'Google Gemini AI',
          recommendation: recommendation || undefined,
          journalLink: journalLink || undefined
        }
      });
    }

    // 4. Intelligent contextual fallback if API key quota exceeded or temporary offline
    let fallbackText = '';

    if (matchedSup) {
      fallbackText = `**${matchedSup.name}** (${matchedSup.designation}, ${matchedSup.department}) specializes in **${(matchedSup.tags || []).join(', ')}** with ${matchedSup.papers} published research papers.\n\nYou can explore faculty profiles or send a supervision request directly through the portal.`;
    } else if (
      lower.includes('ieee') ||
      lower.includes('paper') ||
      lower.includes('journal') ||
      lower.includes('scopus')
    ) {
      fallbackText = `You can explore high-impact peer-reviewed literature across **IEEE Xplore**, **ScienceDirect**, and **Scopus** using direct portals.\n\nFor recent preprints, check **arXiv** to find cutting-edge methodologies.`;
    } else if (
      lower.includes('latex') ||
      lower.includes('overleaf') ||
      lower.includes('template') ||
      lower.includes('word') ||
      lower.includes('slides')
    ) {
      fallbackText = `Official IIUC-formatted **LaTeX packages**, **Word thesis reports**, and **defense presentation slides** are ready for download in the Templates Center.`;
    } else if (
      lower.includes('defense') ||
      lower.includes('rubric') ||
      lower.includes('proposal') ||
      lower.includes('grade')
    ) {
      fallbackText = `IIUC conducts a **3-Stage Defense Evaluation**:\n• **Proposal Defense (30%)** — Problem scope & literature gap\n• **Pre-Defense (20%)** — 60%+ implementation & validation\n• **Final Defense (50%)** — Final thesis report, Q&A & publications`;
    } else {
      fallbackText = `Assalamu Alaikum! I am your IIUC ThesisVerse Assistant. You can search verified supervisors across CSE & EEE, explore official 3-Stage defense guidelines, access IEEE/Scopus research papers, or download official LaTeX/Word thesis templates.`;
    }

    return res.json({
      ok: true,
      response: {
        id: Date.now(),
        sender: 'bot',
        text: fallbackText,
        aiModel: 'contextual_engine',
        recommendation: recommendation || undefined,
        journalLink: journalLink || undefined
      }
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
