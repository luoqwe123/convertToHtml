

// server.js (更新)
const express = require('express');
const multer = require('multer');
const path = require('path');
const marked = require('marked');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = 3000;
const outputFile = path.join(__dirname, 'public', 'output.html');
// 配置 Multer
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));
app.use(cors());
// CSS 和 JS（与之前一致）
const cssStyles = `
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 10px; font-family: Arial, sans-serif; }
    .question { font-size: 1.2em; margin: 20px 0; color: #333; }
    .option { margin: 10px 0; }
    input[type="radio"] { margin-right: 5px; }
    button { padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background-color: #0056b3; }
    @media (max-width: 600px) { body { padding: 5px; font-size: 0.9em; } button { padding: 6px 12px; } }
  </style>
`;
const jsScript = `
  <script>
    function checkAnswer(questionId, correctAnswer) {
      const selected = document.querySelector('input[name="' + questionId + '"]:checked');
      if (!selected) { alert("Please select an answer!"); return; }
      const userAnswer = selected.value.split(')')[0];
      alert(userAnswer === correctAnswer ? "Correct!" : "Wrong! Correct answer is " + correctAnswer);
    }
  </script>
`;

// 解析函数
async function parseMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  let html = marked.parse(content);
  html = html.replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '<h1 class="question">$1</h1>')
             .replace(/<li>([A-D]\).*?)<\/li>/g, (match, p1) => `<li class="option"><input type="radio" name="q1" value="${p1}">${p1}</li>`);
  return html;
}

async function parseDocx(filePath) {
  const result = await mammoth.convertToHtml({ path: filePath });
  let html = result.value;
  html = html.replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '<h1 class="question">$1</h1>')
             .replace(/<p>([A-D]\).*?)<\/p>/g, (match, p1) => `<p class="option"><input type="radio" name="q1" value="${p1}">${p1}</p>`);
  return html;
}

async function parsePdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = await pdf(buffer);
  const lines = data.text.split('\n');
  let html = '';
  let questionCount = 0;
  lines.forEach(line => {
    line = line.trim();
    if (line.match(/^Question \d+/i) || line.match(/^\d+\./)) {
      questionCount++;
      html += `<h1 class="question">${line}</h1>`;
    } else if (line.match(/^[A-D]\)/)) {
      html += `<p class="option"><input type="radio" name="q${questionCount}" value="${line}">${line}</p>`;
    } else if (line) {
      html += `<p>${line}</p>`;
    }
  });
  return html;
}

// 转换路由
app.post('/convert', upload.single('document'), async (req, res) => {
    console.log(req.body)
  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).slice(1).toLowerCase();

  try {
    let htmlContent;
    switch (ext) {
      case 'md': htmlContent = await parseMarkdown(filePath); break;
      case 'docx': htmlContent = await parseDocx(filePath); break;
      case 'pdf': htmlContent = await parsePdf(filePath); break;
      default: throw new Error('Unsupported file type');
    }

    htmlContent = htmlContent.replace(/(<h1 class="question">.*?<\/h1>)/g, (match, p1) => {
      const questionId = `q${Math.random().toString(36).substr(2, 9)}`;
      return `${p1}<button onclick="checkAnswer('${questionId}', 'B')">Submit</button>`;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Converted Questions</title>
        ${cssStyles}
      </head>
      <body>
        ${htmlContent}
       
        ${jsScript}
       
      </body>
      </html>
    `;

    await fs.unlink(filePath); // 删除临时文件
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    console.log()
    await fs.writeFile(outputFile, fullHtml);
    res.json({
        fileUrl: `public/output.html`
      });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});