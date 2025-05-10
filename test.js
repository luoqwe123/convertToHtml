


const degreeReg = /(?<=#+)(\s?[^#]+)/
const blodTitleReg = /[*]+([^*]+)[*]+/g
const blodSplitReg = /(([*]+[^*]+[*]+\s*)+)/g
const degreeSplitReg = /([#]+\s?[^#]+)/
/**
 * 
 * @param {*} input 
 * @param {*} format one：为所有题目和所有答案， two： 为题目答案题目答案（一章一章）   该参数与插入答案有关
 * @param {*} titleStyle blod 和 degree    该参数与匹配标题有关
 * @returns 
 */

function parseQuestionsToJson(input, format) {
    let titleStyle
    // 打印输入的题目字符串，用于调试
    // console.log(input)
    // 使用正则表达式分割输入字符串，按 "答案：" 分割为题目和答案两部分
    let strArr = input.split(/\s+.*[答案]：|:\s+/)
    // console.log("strArr",strArr[0],strArr[1],strArr[2])
    // 清理输入，去除多余空行和空格
    const lines = strArr[0].trim().split('\n').map(line => line.trim()).filter(line => {
        if (line === '' || /^\s*\n+\s*$/g.test(line)) {
            return false
        }
        return true
    });
    if (lines[0][0] === "*") {
        titleStyle = "blod"
    } else {
        titleStyle = "degree"
    }

    // console.log("lines", lines)
    // return
    // console.log(strArr[0].trim())
    // 初始化结果对象
    const result = {}

    // 状态标记：当前解析的题目类型
    let currentType = null;
    let currentQuestion = null;
    let currentOptions = '';

    let title;
    let titleReg = titleStyle === "blod" ? blodTitleReg : degreeReg
    for (let i = 0; i < lines.length; i++) {

        let line = lines[i];
        // 检测题目（以数字开头，如 "1、"）

        if (/^\d+(、|\.)/.test(line)) {
            // 如果已有题目，保存上一题
            if (currentQuestion) {
                addQuestion(result, title, currentType, currentQuestion, currentOptions)
            }
            // 新题目
            currentQuestion = line;
            currentOptions = '';
            continue;
        }

        // 检测选项（以 A．B．C．D． 开头）
        if (/^[A-D](．|\.)/.test(line)) {
            currentOptions += line
            continue;
        }
        // 保存最后一题
        if (currentQuestion) {
            addQuestion(result, title, currentType, currentQuestion, currentOptions)
            currentQuestion = null
        }
        // 从输入字符串中提取标题
        if (titleReg.test(line)) {
            
            let titleMatch
            if (titleStyle === "blod") {
                titleMatch = line.split(/[*]+/).filter(value => value).filter(value => !(/\n+/.test(value)))
            } else {
                titleMatch = line.split(/[#]+/).filter(value => value).filter(value => !(/\n+/.test(value)))
                
            }
            title = titleMatch ? titleMatch.join('') : '默认标题'; // 合并为 "导论"
            title = title.replaceAll(/\s/g, "")

            result[title] = {
                "单选": [],
                "多选": []
            }
            continue;
        }

        // 检测题目类型
        if (/单.*选.*题/.test(line)) {
            currentType = '单选';

        } else if (/多.*选.*题/.test(line)) {

            currentType = '多选';

        }
    }

    if (currentQuestion) {
        addQuestion(result, title, currentType, currentQuestion, currentOptions)
        currentQuestion = null
    }
    if (format === 'one') {
        insertAnswer(strArr[1], result, titleStyle)
    }
    if (format === "two") {
        insertAnswer1(strArr[1], result, title)
    }

    return result
    // return JSON.stringify(result, null, 2);
}

function getNeedStr(input) {
    const lines = input.trim().split('\n').map(line => line.trim()).filter(line => {
        if (line === '' || /^\s*\n+\s*$/g.test(line)) {
            return false
        }
        return true
    });
    let strArr = []
    if (lines[0][0] === "#") {
        strArr = input.split(degreeSplitReg).filter(line => {
            if (line === '' || /^\s*\n+\s*$/g.test(line)) {
                return false
            }
            return true
        });
    } else if (lines[0][0] === '*') {
        strArr = strSplit(input, blodSplitReg)
    } else {
        window.alert("格式错误，必须以标题开头（md中以#或者*）")
    }
    return strArr;
}

function strSplit(str, reg) {
    let res = [];
    let resStr = "";
    let strArr = [...abc.matchAll(degreeSplitReg)];
    let stratIndex = 0;
    let endIndex = 0;
    for (const item of strArr) {
        const value = item[0]
        endIndex = str.indexOf(value, stratIndex)

        if (stratIndex < endIndex) {
            resStr = str.slice(stratIndex, endIndex)
            res.push(resStr)
            stratIndex = endIndex
        }
    }
    res.push(str.slice(endIndex, str.length))
    res.shift()
    return res
}
function addQuestion(result, title, currentType, currentQuestion, currentOptions) {
    // console.log(currentOptions)
    let str = currentOptions.replaceAll(/(?=[A-D].)/g, ',')
    let select = str.split(',')
    let obj = {}
    for (let i = 1; i < select.length; i++) {
        obj[select[i][0]] = select[i].trim().slice(2)
    }

    result[title][currentType].push({
        question: currentQuestion,
        select: obj,
        type: currentType
    });
}


function insertAnswer(str, result, titleStyle) {

    // 结果
    let res = {}
    let answerType = ''
    let questionNumber = 1 // 题号
    let title = ''
    // console.log(str)

    // const lines = str.trim().split("**").map(line => line.trim()).filter(line => line).filter(line => !(/^\d/.test(line)))
    const lines = str.trim().split('\n').map(line => line.trim()).filter(line => line)
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
        } else if (/.*[A-Z]+/.test(item)) {
            const frontAnswerReg = /[a-zA-Z]+/g
            let answerArr = [...item.matchAll(frontAnswerReg)].map(item => item[0])

            if (answerType === "单选") {
                let newArr = []
                for (const value of answerArr) {
                    newArr.push(...value.split(/([a-zA-Z])/).filter(line => line))
                }
                answerArr = newArr
            }
            answerArr.forEach((value, index) => {
                res[title][answerType][questionNumber] = value
                questionNumber++
            })

        } else {
            let titleMatch
            if (titleStyle === "blod") {
                titleMatch = item.split(/[*]+/).filter(value => value).filter(value => !(/\n+/.test(value)))
            } else {
                titleMatch = item.split(/[#]+/).filter(value => value).filter(value => !(/\n+/.test(value)))
            }
            title = titleMatch ? titleMatch.join('') : '默认标题'; // 合并为 "导论"
            title = title.replaceAll(/\s/g, "")


            res[title] = {
                "单选": {},
                "多选": {}
            }
        }
    })
    // console.log(res)
    // console.log("result",result)
    for (const key1 in res) {
        for (const key2 in result) {
            if (key2.includes(key1)) {
                for (const key3 in result[key2]) {
                    for (const item of result[key2][key3]) {
                        // console.log(item.question)
                        let qNumber = item.question.match(/^\d+/)[0]
                        item.answer = res[key1][key3][qNumber]
                    }
                }
                break
            }
        }
    }
    // console.log(JSON.stringify(result, null, 2))
    return JSON.stringify(result, null, 2)
}

function insertAnswer1(str, result, title) {
    // 结果
    let res = {}
    let answerType = ''
    let questionNumber = 1 // 题号

    // console.log(str)

    // const lines = str.trim().split("**").map(line => line.trim()).filter(line => line).filter(line => !(/^\d/.test(line)))
    const lines = str.trim().split('\n').map(line => line.trim()).filter(line => line)
    // let titleReg = /\*\*([^\*]+)\*\*/
    res[title] = {
        "单选": {},
        "多选": {}
    }
    lines.forEach((item, index) => {

        if (/(单选|多选)/.test(item)) {

            questionNumber = 1 // 换题型重新计算题号
            if (/(单选)/.test(item)) {
                answerType = "单选"
            }
            if (/(多选)/.test(item)) {
                answerType = "多选"
            }
        } else if (/.*[A-Z]+/.test(item)) {
            const frontAnswerReg = /[a-zA-Z]+/g
            let answerArr = [...item.matchAll(frontAnswerReg)].map(item => item[0])

            if (answerType === "单选") {
                let newArr = []
                for (const value of answerArr) {
                    newArr.push(...value.split(/([a-zA-Z])/).filter(line => line))
                }
                answerArr = newArr
            }
            answerArr.forEach((value, index) => {
                
                res[title][answerType][questionNumber] = value
                questionNumber++
            })

        }
    })
    
    for (const key1 in res) {
        for (const key2 in result) {
            if (key2.includes(key1)) {
                for (const key3 in result[key2]) {
                    for (const item of result[key2][key3]) {
                        // console.log(item.question)
                        let qNumber = item.question.match(/^\d+/)[0]
                        item.answer = res[key1][key3][qNumber]
                    }
                }
                break
            }
        }
    }
    // console.log(JSON.stringify(result, null, 2))
    return JSON.stringify(result, null, 2)
}

export function main(str) {
    let res = {};
    const changeStr = str.split(/\s+.*[答案]：|:\s+/g) //  后期改为标题
   
   
    if (changeStr.length <= 2) {
        res = parseQuestionsToJson(str, "one")
    } else {
        let arr = []
        let newStrArr = getNeedStr(str)
        for (const item of newStrArr) {
            arr.push(parseQuestionsToJson(item, "two"))
        }

        for (const item of arr) {
            for (const key in item) {
                res[key] = item[key]
            }
        }
        // paresquestion2(newStr)
    }
    
    return JSON.stringify(res, null, 2);
}

// console.log(res)
