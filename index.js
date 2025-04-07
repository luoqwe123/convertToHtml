// index.js
const fs = require('fs').promises; // 使用 Promise 版本的 fs
const path = require('path');
const marked = require('marked');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');


// 支持的文件类型
const supportedExtensions = ['md', 'docx', 'pdf'];

// CSS 样式，确保手机和电脑兼容
const cssStyles = `
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 10px; font-family: Arial, sans-serif; }
    .question { font-size: 1.2em; margin: 20px 0; color: #333; }
    .option { margin: 10px 0; }
    input[type="radio"] { margin-right: 5px; }
    button { padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:hover { background-color: #0056b3; }
    @media (max-width: 600px) { 
      body { padding: 5px; font-size: 0.9em; }
      button { padding: 6px 12px; }
    }
  </style>
`;

// 判题脚本（简单示例，答案固定为 B）
const jsScript = `
  <script>
    function checkAnswer(questionId, correctAnswer) {
      const selected = document.querySelector('input[name="' + questionId + '"]:checked');
      if (!selected) {
        alert("Please select an answer!");
        return;
      }
      const userAnswer = selected.value.split(')')[0];
      alert(userAnswer === correctAnswer ? "Correct!" : "Wrong! Correct answer is " + correctAnswer);
    }
  </script>
`;

// 解析 Markdown 文件
async function parseMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  let html = marked.parse(content);
  // console.log("md",html)
  // 规范化题目和选项
  html = html.replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '<h1 class="question">$1</h1>')
             .replace(/<li>([A-D]\).*?)<\/li>/g, (match, p1) => `<li class="option"><input type="radio" name="q1" value="${p1}">${p1}</li>`);
  return html;
}

// 解析 Docx 文件
async function parseDocx(filePath) {
  const result = await mammoth.convertToHtml({ path: filePath });
  let html = result.value;
  // 规范化题目和选项
  html = html.replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '<h1 class="question">$1</h1>')
             .replace(/<p>([A-D]\).*?)<\/p>/g, (match, p1) => `<p class="option"><input type="radio" name="q1" value="${p1}">${p1}</p>`);
  return html;
}

// 解析 PDF 文件
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

// 主转换函数
async function convertToHtml(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (!supportedExtensions.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  let htmlContent;
  switch (ext) {
    case 'md':
      htmlContent = await parseMarkdown(filePath);
      break;
    case 'docx':
      htmlContent = await parseDocx(filePath);
      break;
    case 'pdf':
      htmlContent = await parsePdf(filePath);
      break;
  }

  // 添加交互按钮（每题一个按钮，假设答案为 B）
  htmlContent = htmlContent.replace(/(<h1 class="question">.*?<\/h1>)/g, (match, p1) => {
    const questionId = `q${Math.random().toString(36).substr(2, 9)}`; // 随机 ID
    return `${p1}<button onclick="checkAnswer('${questionId}', 'B')">Submit</button>`;
  });

  // 组装完整 HTML
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Questions</title>
      ${cssStyles}
    </head>
    <body>
      ${htmlContent}
      ${jsScript}
    </body>
    </html>
  `;

  return fullHtml;
}

// 主函数
async function main() {
  const inputFile = process.argv[2]; // 命令行参数传入文件路径
  if (!inputFile) {
    console.error("Please provide a file path. Usage: node index.js <file>");
    return;
  }

  try {
    const html = await convertToHtml(inputFile);
    const outputFile = 'output.html';
    await fs.writeFile(outputFile, html);
    console.log(`Conversion successful! Output saved to ${outputFile}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();