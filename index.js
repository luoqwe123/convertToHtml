// 判题与渲染题


let currentQuestionIndex = 0

// 构建题目导航
function buildErrQustion(currentQuestionIndex, question) {
    let el = document.querySelector(`li[data-global-index='${currentQuestionIndex}']`)
    //   console.log("li",el,currentQuestionIndex,question.answer,question.userAnswer,question.chooseRight)
    // console.log(el)
    if (question.chooseRight === false) {
        el.classList.add('incorrect');
        if (el.classList.contains('correct')) el.classList.remove("correct")
    } else if (question.chooseRight === true) {
        el.classList.add("correct")
        if (el.classList.contains('incorrect')) el.classList.remove("incorrect")
    }

}
function buildQuestionList(data,questionMap) {
    // 题目导航数据
    
    let questionIndex = 0;
    const questionList = document.querySelector('.question-list');
    questionList.innerHTML = '';
    let frist = true
    let historyIndex = 0

    Object.keys(data).forEach(chapter => {
        let value = data[chapter]
        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `<h3>${chapter}</h3>`;
        questionList.appendChild(chapterDiv);

        // 单选
        Object.keys(value).forEach(item => {
            if (data[chapter][item].length > 0) {
                let selectTypeDiv = document.createElement('div');
                selectTypeDiv.innerHTML = `<h5>${item}</h5>`;
                chapterDiv.appendChild(selectTypeDiv);
                const singleChoiceUl = document.createElement('ul');
                data[chapter][item].forEach((q, idx) => {

                    const li = document.createElement('li');
                    li.textContent = `${idx + 1}`;
                    li.dataset.chapter = chapter;
                    li.dataset.type = item;
                    li.dataset.index = idx;
                    li.dataset.globalIndex = questionIndex;
                    // console.log(questionIndex)
                    if (frist) {
                        li.classList.add('active');
                        frist = false
                    }
                    singleChoiceUl.appendChild(li);
                    // buildErrQustion(questionIndex, q)
                    questionMap.push({ chapter, type: item, index: idx, globalIndex: questionIndex });
                    questionIndex++;
                });
                chapterDiv.appendChild(singleChoiceUl);
                //  导航元素挂载之后进行历史正误的样式变化
                // console.log(questionIndex)
                data[chapter][item].forEach((q, idx) => {
                    // console.log(q)
                    if (q.userAnswer) buildErrQustion(historyIndex, q)
                    historyIndex++
                });
            }

        })
    });

    // 点击切换题目
    questionList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const globalIndex = parseInt(li.dataset.globalIndex);
        currentQuestionIndex = globalIndex
        renderQuestion(data, globalIndex,questionMap);
        document.querySelectorAll('.question-list li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
    });
}

// 渲染题目
function renderQuestion(data, globalIndex,questionMap) {
    
    const { chapter, type, index } = questionMap[globalIndex];
    const question = data[chapter][type][index];
    const resultDiv = document.querySelector('.result');
    resultDiv.innerHTML = '';

    // 题目
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.textContent = question.question;
    resultDiv.appendChild(questionDiv);

    // 选项
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    const options = Object.entries(question.select);
    // console.log(options)
    const name = `question-${globalIndex}`;

    if (type != '多选') {
        let hasAnswered = false; // 标记是否已选择

        options.forEach(([key, value]) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = name;
            input.value = key;

            input.addEventListener('change', () => {
                if (!hasAnswered) {
                    let chooseRight = checkSingleChoice(input.value, question.answer, optionsDiv);
                    question.chooseRight = chooseRight
                    question.userAnswer = input.value
                    buildErrQustion(currentQuestionIndex, question)
                    hasAnswered = true; // 锁定判断
                }
            });

            label.appendChild(input);
            label.appendChild(document.createTextNode(`${key}. ${value}`));
            optionsDiv.appendChild(label);
        });
        // 选择之前检查历史
        if (question.userAnswer) {
            checkSingleChoice(question.userAnswer, question.answer, optionsDiv);
            hasAnswered = true;
        }
    } else {
        // 跟踪复选框选择状态
        let selectedAnswers = [];

        options.forEach(([key, value]) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = key;

            input.addEventListener('change', () => {
                // 切换激活状态

                if (input.checked) {
                    label.classList.add('active');
                    if (!selectedAnswers.includes(key)) {
                        selectedAnswers.push(key);
                    }
                } else {
                    label.classList.remove('active');
                    selectedAnswers = selectedAnswers.filter(ans => ans !== key);
                }
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(`${key}. ${value}`));
            optionsDiv.appendChild(label);
        });
        if (question.userAnswer) {
            checkMultiChoice(optionsDiv, question.answer, question.userAnswer);
        }
        // 提交按钮
        const submitBtn = document.createElement('button');
        submitBtn.className = 'submit-btn';
        submitBtn.textContent = '提交';
        submitBtn.addEventListener('click', () => {
            const sortedSelected = selectedAnswers.sort().join('');
            let chooseRight = checkMultiChoice(optionsDiv, question.answer, sortedSelected)
            question.chooseRight = chooseRight
            question.userAnswer = sortedSelected
            buildErrQustion(currentQuestionIndex, question)

        });
        questionDiv.appendChild(submitBtn);
    }

    resultDiv.appendChild(optionsDiv);
}

// 单选题检查
function checkSingleChoice(value, correctAnswer, optionsDiv) {

    const selected = value;
    const labels = optionsDiv.querySelectorAll('label');

    let res = false
    labels.forEach(label => {

        const input = label.querySelector('input');
        const key = input.value;
        label.className = '';

        if (key === correctAnswer) {
            label.className = 'correct';

        } else if (key === selected && selected !== correctAnswer) {
            label.className = 'incorrect';

        }
    });
    if (correctAnswer == selected) {
        res = true
    }
    return res
}

// 不定项检查
function checkMultiChoice(optionsDiv, correctAnswer, sortedSelected) {

    const labels = optionsDiv.querySelectorAll('label');
    let res = false
    labels.forEach(label => {
        const input = label.querySelector('input');
        const key = input.value;

        label.className = ''; // 重置样式

        if (correctAnswer.includes(key)) {
            label.className = 'correct';
        } else if (sortedSelected.includes(key) && !correctAnswer.includes(key)) {
            label.className = 'incorrect';

        } else if (label.classList.contains('active')) {
            label.className = 'active'; // 保留激活样式
        }
    });
    if (sortedSelected === correctAnswer) res = true
    return res
}

// 初始化
function showResult(data) {

    const questionMap = [];
    // console.log(data)
    buildQuestionList(data,questionMap);
    renderQuestion(data, 0,questionMap);

}
