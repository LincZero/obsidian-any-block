# obsidian-any-block
 
 A Obsidian Plugin. You can flexibility to create a 'Block' by some means.
 
 ## Usage

 `%{` and `%}` include some content

 such as
 
 ```
 %{list2mdtable

- **语言** | **三元换行符** | **特点**
- java
  - 
      ```java
      System.out.println("Hello World");
      ```
        - 这语句有点长
- c
    - 
      ```c
      printf("Hello World")
      ```
        - 原始的C输出
- c++
    - 
      ```cpp
      std::cunt<<"Hello Wrold"
      ```
        - 流输出，但是这东西开销大，竞赛党别用

- python
    - 
      ```python
      println("Hello World")
      ```
        - 需要注意一下Python2和Python3的打印语句不同

- js
    - 
      ```js
      console.log("Hello World");
      ```
        - 控制台打印

%}
```

## Suport command

- md
- quote
- code
- list2table
- list2mdtable
- list2lt
- list2mermaid

## If bug

try to close `strict line wrapping`
