const PREC = {
  assign: 1,
  conditional: 2,
  comma: 3,
  additive: 4,
  multiplicative: 5,
  unary: 6,
  call: 7,
  primary: 8,
  return_with_expr: 9,
  branch: 10,
};

module.exports = grammar({
  name: "wq",

  extras: ($) => [/[ \t\r]+/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.postfix_expression, $.index_expression, $.call_expression],
  ],

  rules: {
    source_file: ($) =>
      seq(
        optional($._statement),
        repeat(seq(choice(";", $.newline), $._statement)),
        optional(choice(";", $.newline)),
      ),

    _statement: ($) =>
      choice(
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.assert_statement,
        $.expression,
      ),

    expression: ($) =>
      choice(
        $.assignment,
        $.conditional_expression,
        $.conditional_expression_short,
        $.while_loop,
        $.for_loop,
        $.function_definition,
        $.additive_expression,
        $.postfix_expression,
        $.leading_comma_list,
        $.primary_expression,
      ),

    assignment: ($) =>
      prec.right(
        PREC.assign,
        seq(
          field("left", choice($.identifier, $.index_expression)),
          ":",
          field("right", $.expression),
        ),
      ),

    additive_expression: ($) =>
      prec.left(
        PREC.additive,
        seq(
          field("left", $.comparison_expression),
          repeat1(
            seq(
              field("operator", choice("+", "-")),
              field("right", $.comparison_expression),
            ),
          ),
        ),
      ),

    comparison_expression: ($) =>
      prec.left(
        PREC.conditional,
        seq(
          field("left", $.multiplicative_expression),
          repeat1(
            seq(
              field("operator", choice("==", "!=", "<", "<=", ">", ">=")),
              field("right", $.multiplicative_expression),
            ),
          ),
        ),
      ),

    multiplicative_expression: ($) =>
      prec.left(
        PREC.multiplicative,
        seq(
          field("left", $.unary_expression),
          repeat1(
            seq(
              field("operator", choice("*", "/", "%")),
              field("right", $.unary_expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec.right(
        PREC.unary,
        choice(
          seq("-", $.unary_expression),
          seq("#", $.unary_expression),
          $.postfix_expression,
          $.parenthesized_expression,
          $.empty_list,
          $.multi_list,
          $.dict,
          $.identifier,
          $.literal,
        ),
      ),

    postfix_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field("object", $.primary_expression),
          repeat1(
            choice(
              $.call_suffix,
              $.index_suffix,
              prec(1, field("implicit_call", $.unary_expression)),
            ),
          ),
        ),
      ),

    call_suffix: ($) => seq("[", optional(sepBy1(";", $.expression)), ";", "]"),

    index_suffix: ($) => seq("[", sepBy1(";", $.expression), "]"),

    call_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field(
            "function",
            choice($.identifier, $.postfix_expression, $.primary_expression),
          ),
          $.call_suffix,
        ),
      ),

    index_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field(
            "object",
            choice($.identifier, $.postfix_expression, $.primary_expression),
          ),
          $.index_suffix,
        ),
      ),

    conditional_expression: ($) =>
      seq(
        "$",
        "[",
        field("condition", $.expression),
        ";",
        field("true_branch", $.branch_sequence),
        ";",
        field("false_branch", $.branch_sequence),
        "]",
      ),

    conditional_expression_short: ($) =>
      seq(
        "$.",
        "[",
        field("condition", $.expression),
        ";",
        field("true_branch", $.branch_sequence),
        "]",
      ),

    while_loop: ($) =>
      seq(
        "W",
        "[",
        field("condition", $.expression),
        ";",
        field("body", $.branch_sequence),
        "]",
      ),

    for_loop: ($) =>
      seq(
        "N",
        "[",
        field("count", $.expression),
        ";",
        field("body", $.branch_sequence),
        "]",
      ),

    branch_sequence: ($) =>
      prec.right(
        PREC.branch,
        seq($.expression, repeat(seq(choice(";", $.newline), $.expression))),
      ),

    statement_list: ($) =>
      seq($._statement, repeat(seq(choice(";", $.newline), $._statement))),

    function_definition: ($) =>
      seq("{", optional($.parameter_list), repeat1($.statement_list), "}"),

    parameter_list: ($) => seq("[", optional(sepBy1(";", $.identifier)), "]"),

    primary_expression: ($) =>
      choice(
        $.identifier,
        $.literal,
        $.parenthesized_expression,
        $.empty_list,
        $.multi_list,
        $.dict,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    empty_list: ($) => seq("(", ")"),

    multi_list: ($) =>
      seq(
        "(",
        $.expression,
        repeat1(seq(choice(";", $.newline), $.expression)),
        optional(choice(";", $.newline)),
        ")",
      ),

    dict: ($) => seq("(", sepBy1(choice(";", $.newline), $.pair), ")"),

    pair: ($) => seq(field("key", $.symbol), ":", field("value", $.expression)),

    leading_comma_list: ($) =>
      prec.right(
        PREC.primary,
        seq(",", $.expression, repeat(seq(",", $.expression))),
      ),

    literal: ($) => choice($.integer, $.float, $.string, $.boolean, $.symbol),

    boolean: ($) => choice("true", "false"),

    break_statement: ($) => "@b",
    continue_statement: ($) => "@c",
    assert_statement: ($) => seq("@a", $.expression),

    return_statement: ($) =>
      choice(prec(PREC.return_with_expr, seq("@r", $.expression)), "@r"),

    identifier: ($) => /[A-Za-z_][A-Za-z0-9_?]*/,

    symbol: ($) => /`[A-Za-z_][A-Za-z0-9_?]*/,

    integer: ($) => token(/[0-9]+/),
    float: ($) => token(/[0-9]+\.[0-9]+/),

    string: ($) => token(seq('"', /([^"\\]|\\.)*/, '"')),

    comment: ($) => token(seq("//", /[^\n]*/)),

    newline: ($) => /\r?\n/,
  },
});

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
