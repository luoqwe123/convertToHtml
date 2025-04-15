
// 解析函数
export function parseQuestionsToJson(input) {
    // 清理输入，去除多余空行和空格
    const lines = input.trim().split('\n').map(line => line.trim()).filter(line => line);

    // 初始化结果
    const result = {}

    // 状态标记：当前解析的题目类型
    let currentType = null;
    let currentQuestion = null;
    let currentOptions = '';
    let questionNumber = 0;

    // 单选题答案（根据题目逻辑）
    const singleChoiceAnswers = {
        "1": "A", // 狭义的马克思主义
        "2": "D"  // 客观条件
    };

    // 不定项选择题答案
    const multiChoiceAnswers = {
        "1": "ABCD", // 广义马克思主义
        "2": "ABD"   // 理论来源
    };
    let title;
    let titleReg = /\*\*([^\*]+)\*\*\s*\*\*([^\*]+)\*\*/
    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        // 检测题目（以数字开头，如 "1、"）
        if (/^\d+、/.test(line)) {
            // 如果已有题目，保存上一题
            
            if (currentQuestion) {
                addQuestion(result, title, currentType, questionNumber, currentQuestion, currentOptions, singleChoiceAnswers, multiChoiceAnswers)
            }

            // 新题目
            questionNumber = line.match(/^\d+/)[0];
            currentQuestion = line;
            currentOptions = {};
            continue;
        }

        // 检测选项（以 A．B．C．D． 开头）
        if (/^[A-D]．/.test(line)) {
            currentOptions += line
            continue;
        }
        // 保存最后一题
        if (currentQuestion) {
            addQuestion(result, title, currentType, questionNumber, currentQuestion, currentOptions, singleChoiceAnswers, multiChoiceAnswers)
            currentQuestion = null
        }
        // 从输入字符串中提取标题
        if (titleReg.test(line)) {
            const titleMatch = line.match(titleReg);
            title = titleMatch ? titleMatch[1] + titleMatch[2] : '默认标题'; // 合并为 "导论"
            result[title] = {
                "单选": [],
                "不定项": []
            }
            continue;
        }
        // console.log("line", line[0], line, line.includes('单项选择题'))
        // 检测题目类型
        if (line.includes('单项选择题')) {
            currentType = '单选';

        } else if (line.includes('多项选选题')) {
            currentType = '不定项';

        }
    }

    if (currentQuestion) {
        addQuestion(result, title, currentType, questionNumber, currentQuestion, currentOptions, singleChoiceAnswers, multiChoiceAnswers)
        currentQuestion = null
    }

    return JSON.stringify(result, null, 2);
}


function addQuestion(result, title, currentType, questionNumber, currentQuestion, currentOptions, singleChoiceAnswers, multiChoiceAnswers) {
    let str = currentOptions.replaceAll(/(?=[A-D].)/g,',')
    let select = str.split(',')
    let obj = {}
    for(let i = 1;i<select.length;i++){
        obj[select[i][0]] = select[i].trim().slice(2)
    }
    result[title][currentType].push({
        question: currentQuestion,
        select: obj,
        answer: currentType === '单选' ? singleChoiceAnswers[questionNumber] : multiChoiceAnswers[questionNumber],
        type: currentType
    });
}


