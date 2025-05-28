const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Thêm thư viện cors

const app = express();

// Sử dụng middleware CORS để cho phép tất cả origin (hoặc chỉ định Netlify)
app.use(cors()); // Cho phép tất cả origin
// Nếu muốn chỉ định Netlify, dùng:
// app.use(cors({ origin: 'https://mayer-multimedia-tool.netlify.app' }));

app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
