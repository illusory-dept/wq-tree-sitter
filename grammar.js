const PREC = {
  call: 9,
  unary: 8,
  multiplicative: 7,
  additive: 6,
  comparison: 5,
  assignment: 1,
};

module.exports = grammar({
  name: "wq",

  extras: ($) => [/[^\S\n]+/, $.comment],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => seq($._expression, optional(choice(";", "\n"))),

    _expression: ($) =>
      choice(
        $.assignment,
        $.binary_expression,
        $.unary_expression,
        $.call,
        $.index,
        $.list,
        $.dict,
        $.function_definition,
        $.conditional,
        $.conditional_dot,
        $.while_loop,
        $.for_loop,
        $.identifier,
        $.number,
        $.string,
        $.symbol,
        $.boolean,
      ),

    number: (_) => /[0-9]+(\.[0-9]+)?/,

    string: (_) => token(seq('"', repeat(choice(/[^"\\\n]+/, /\\./)), '"')),

    symbol: (_) => token(seq("`", /[a-zA-Z_][a-zA-Z0-9_]*/)),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    boolean: (_) => choice("true", "false"),

    comment: (_) => token(seq("//", /.*/)),

    list: ($) => seq("(", sepBy($._expression, ";"), optional(";"), ")"),

    dict: ($) =>
      seq(
        "(",
        sepBy1(seq($.symbol, ":", $._expression), ";"),
        optional(";"),
        ")",
      ),

    call: ($) =>
      prec(
        PREC.call,
        seq(
          field("function", $._expression),
          "[",
          sepBy($._expression, ";"),
          ";",
          "]",
        ),
      ),

    index: ($) =>
      prec(
        PREC.call,
        seq(
          field("object", $._expression),
          "[",
          sepBy1($._expression, ";"),
          "]",
        ),
      ),

    unary_expression: ($) =>
      prec(PREC.unary, seq(choice("-", "#"), $._expression)),

    binary_expression: ($) =>
      choice(
        prec.left(
          PREC.multiplicative,
          seq($._expression, choice("*", "/", "%"), $._expression),
        ),
        prec.left(
          PREC.additive,
          seq($._expression, choice("+", "-"), $._expression),
        ),
        prec.left(
          PREC.comparison,
          seq(
            $._expression,
            choice("=", "~", "<", ">", "<=", ">="),
            $._expression,
          ),
        ),
      ),

    assignment: ($) =>
      prec.right(
        PREC.assignment,
        seq(
          field("left", choice($.identifier, $.index)),
          ":",
          field("right", $._expression),
        ),
      ),

    conditional: ($) =>
      seq(
        "$",
        "[",
        $._expression,
        ";",
        $._expression,
        optional(seq(";", $._expression)),
        "]",
      ),

    conditional_dot: ($) =>
      seq("$.", "[", $._expression, ";", sepBy1($._expression, ";"), "]"),

    while_loop: ($) => seq("W", "[", $._expression, ";", $._expression, "]"),

    for_loop: ($) => seq("N", "[", $._expression, ";", $._expression, "]"),

    function_definition: ($) =>
      seq(
        "{",
        optional(
          seq("[", optional(sepBy1($.identifier, ";")), optional(";"), "]"),
        ),
        repeat($._expression),
        "}",
      ),
  },
});

function sepBy1(rule, delim) {
  return seq(rule, repeat(seq(delim, rule)));
}

function sepBy(rule, delim) {
  return optional(sepBy1(rule, delim));
}
