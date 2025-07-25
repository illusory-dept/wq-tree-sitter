; ---- comments ----
(comment) @comment

; ---- literals ----
(integer) @number
(float)   @number
(string)  @string
(boolean) @boolean
(symbol)  @string.special.symbol

; ---- identifiers / params / properties ----
(identifier) @variable
(parameter_list (identifier) @variable.parameter)
(pair key: (symbol) @property)

; ---- functions / calls ----
(postfix_expression
  object: (primary_expression (identifier) @function)
  (call_suffix))

(function_definition "{" @punctuation.bracket)
(function_definition "}" @punctuation.bracket)

; ---- assignment ----
(assignment
  left: (identifier) @variable)

; ---- keywords ----
(conditional_expression "$"  @keyword)
(conditional_expression_short "$." @keyword)
(while_loop "W" @keyword)
(for_loop   "N" @keyword)
(break_statement)    @keyword
(continue_statement) @keyword
(assert_statement)   @keyword
(return_statement)   @keyword

; ---- operators ----
["*" "/" "%" "+" "-" "==" "!=" "<" ">" "<=" ">=" "#"] @operator

; ---- punctuation ----
[";" ":" ","] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
