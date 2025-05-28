const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    // Lấy dữ liệu từ form được gửi từ client
    const {
      projectType,
      audience,
      goal,
      priorKnowledge,
      contentMedium,
      timeConstraint,
      interactionLevel,
      description
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    const requiredFields = [
      projectType,
      audience,
      goal,
      priorKnowledge,
      contentMedium,
      timeConstraint,
      interactionLevel,
      description
    ];

    let allFieldsFilled = true;
    for (let field of requiredFields) {
      if (Array.isArray(field) && field.length === 0) {
        allFieldsFilled = false;
        break;
      } else if (!field && field !== 0) {
        allFieldsFilled = false;
        break;
      }
    }

    if (!allFieldsFilled) {
      return res.status(400).json({ error: 'Please fill in all 8 fields before submitting.' });
    }

    // Tạo prompt dựa trên dữ liệu form
    const prompt = `You are an expert in Mayer's 12 Multimedia Design Principles. Based on the following project details, recommend the most relevant principles to optimize the multimedia design. Ensure recommendations are highly specific to the project context, with clear justifications explaining why each principle is applicable based on the provided details. Format the response in English, using a heading (## Recommended Principles) followed by bullet points (e.g., - Principle Name: Description). Do not use tables or any other formatting except headings and bullet points. Ensure the recommendations are concise, practical, and directly applicable to the project.

    Project Details:
    - Project Type: ${projectType.join(', ')}
    - Target Audience: ${audience.join(', ')}
    - Design Goal: ${goal.join(', ')}
    - Prior Knowledge Level: ${priorKnowledge.join(', ')}
    - Content Medium: ${contentMedium.join(', ')}
    - Time Constraint: ${timeConstraint.join(', ')}
    - Interaction Level: ${interactionLevel.join(', ')}
    - Project Description: ${description.trim()}
    `;

    // Gọi API Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
