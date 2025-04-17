### 这是一个md,doc等文档转化为 判题网页的（html） 小工具

`背景`：
    一到期末复习，需要打印大量的模拟题，但是我想在手机或电脑进行做题，且想要他能有判题功能

`功能`:
        1. 能够识别 md,doc,pdf 文件，并进行转换
        2. 对文档的要求，分题目，答案两部分（每个部分需要有唯一标识）
        3. 能够精准的进行判题
        4. 分页做题，能选择页码，单选题选完直接出答案，多选题 有一个提交按钮，选完点击按钮进行提交
`拓展功能`：
        与小秋ai 关联，当选择完，可以询问ai 为什么是这个答案（给与解释）



总的数据结构

```json
{
  "导论"：{
    "单选"：[
      {
	question: "1、狭义的马克思主义是指：（  ）",
	select:
        {
        	"A": "马克思恩格斯创立的基本理论基本观点和学说的体系",
            "B": "列宁主义"
        }
    answer: "A",
    type: "单选",
    chooseRight: false
    userAnswer: "C"
      },
    ],
    "多选"：{
      {
    question: "1、狭义的马克思主义是指：（  ）",
    select: 
        {
            "A": "马克思恩格斯创立的基本理论基本观点和学说的体系",
            "B": "列宁主义"
        }
    answer: "AB",
    type: "多选",

      },
    }
  }
}
```

答案的数据结构

```
{
   "导论"：{
		"单选"：{
			"1":{
            	answer: "A",
        	},
    	},
        "多选"：{
            "1":{	
                answer: "AB",
            },
        }
   }
}
```



需求： （还未实现）
        1. 实现两个按钮，重置清空所有历史记录，当前question 回到第一个（将所有userAnswer 变为空，重新渲染题目和导航），将做题记录保存在本地 ✨ 
        2. 对文档的 答案进行识别 ✨ 
		3.布局  ✨ 
		4. 文档格式的通用性（后期可与ai联动，直接让ai给我转我需要的数据结构）
		5. 查看是否存在将md语法转化为字符串（去除md的特殊符号）



使用： 必须题目在前，答案在后，且必须在答案部分的前面加上 "答案"两个字， 暂时只能匹配使用 **对题目和答案进行加粗的文本（其他的可能出错），仿照根目录下的test.md为最佳