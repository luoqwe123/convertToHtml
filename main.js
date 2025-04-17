
// 解析函数
export function parseQuestionsToJson(input) {
   
    let strArr = input.split(/\n*答案：\n*/)
   
    // 清理输入，去除多余空行和空格
    const lines = strArr[0].trim().split('\n').map(line => line.trim()).filter(line => line);

    // 初始化结果
    const result = {}

    // 状态标记：当前解析的题目类型
    let currentType = null;
    let currentQuestion = null;
    let currentOptions = '';

    let title;
    let titleReg = /\*\*([^\*]+)\*\*\s*\*\*([^\*]+)\*\*/
    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        // 检测题目（以数字开头，如 "1、"）
        if (/^\d+、/.test(line)) {
            // 如果已有题目，保存上一题
            
            if (currentQuestion) {
                addQuestion(result, title, currentType,  currentQuestion, currentOptions)
            }

            // 新题目
          
            currentQuestion = line;
            currentOptions = '';
            continue;
        }

        // 检测选项（以 A．B．C．D． 开头）
        if (/^[A-D]．/.test(line)) {
            currentOptions += line
            continue;
        }
        // 保存最后一题
        if (currentQuestion) {
            addQuestion(result, title, currentType,  currentQuestion, currentOptions)
            currentQuestion = null
        }
        // 从输入字符串中提取标题
        if (titleReg.test(line)) {
            const titleMatch = line.match(titleReg);
            title = titleMatch ? titleMatch[1] + titleMatch[2] : '默认标题'; // 合并为 "导论"
            result[title] = {
                "单选": [],
                "多选": []
            }
            continue;
        }
        // console.log("line", line[0], line, line.includes('单项选择题'))
        // 检测题目类型
        if (/单.*选.*题/.test(line)) {
            currentType = '单选';

        } else if (/多.*选.*题/.test(line)) {
            // console.log(line)
            currentType = '多选';

        }
    }

    if (currentQuestion) {
        addQuestion(result, title, currentType,  currentQuestion, currentOptions)
        currentQuestion = null
    }
    insertAnswer(strArr[1],result)
    return JSON.stringify(result, null, 2);
}


function addQuestion(result, title, currentType, currentQuestion, currentOptions) {
    // console.log(currentOptions)
    let str = currentOptions.replaceAll(/(?=[A-D].)/g,',')
    let select = str.split(',')
    let obj = {}
    for(let i = 1;i<select.length;i++){
        obj[select[i][0]] = select[i].trim().slice(2)
    }
    result[title][currentType].push({
        question: currentQuestion,
        select: obj,
        type: currentType
    });
}


function insertAnswer(str, result) {
    // 结果
    let res = {}
    let answerType = ''
    let questionNumber = 1 // 题号
    let title = ''
    // console.log(str)
    const lines = str.trim().split("**").map(line => line.trim()).filter(line => line).filter(line => !(/^\d/.test(line)))
    // const lines = str.trim().split('\n').map(line => line.trim()).filter(line => line);
    // let titleReg = /\*\*([^\*]+)\*\*/

    lines.forEach((item, index) => {
        if (/(单选|多选)/.test(item)) {
            questionNumber = 1 // 换题型重新计算题号
            if (/(单选)/.test(item)) {
                answerType = "单选"
            }
            if (/(多选)/.test(item)) {
                answerType = "多选"
            }
        } else if (/[A-Z]+/.test(item)) {

            let answerArr = item.split(/\s/)
            answerArr.forEach((value, index) => {
                res[title][answerType][questionNumber] = value
                questionNumber++
            })

        } else {

            title = item.replaceAll(/\s/g, "")

            res[title] = {
                "单选": {},
                "多选": {}
            }
        }
    })

    for (const key1 in res) {
        for (const key2 in result) {
            if (key2.includes(key1)) {
                for (const key3 in result[key2]) {
                    for (const item of result[key2][key3]) {
                        let qNumber = item.question.match(/^\d+/)[0]
                        item.answer = res[key1][key3][qNumber]
                    }
                }
                break
            }
        }
    }
    return JSON.stringify(result,null,2)
}