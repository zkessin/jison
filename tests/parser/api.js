var Jison = require("../setup").Jison,
    Lexer = require("../setup").Lexer,
    assert = require("assert");

var lexData = {
    rules: [
       ["x", "return 'x';"],
       ["y", "return 'y';"]
    ]
};

exports["test tokens as a string"] = function () {

    var grammar = {
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :[ 'A x',
                   'A y',
                   ''      ]
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test generator"] = function () {

    var grammar = {
        bnf: {
            "A" :[ 'A x',
                   'A y',
                   ''      ]
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test extra spaces in productions"] = function () {

    var grammar = {
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :[ 'A x ',
                   'A y',
                   ''      ]
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test | separated rules"] = function () {

    var grammar = {
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :"A x | A y | "
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test start symbol optional"] = function () {

    var grammar = {
        tokens: "x y z",
        bnf: {
            "A" :"A x | A y | B",
            "B" :"z"
        }
    };

    var gen = Jison.Generator(grammar);
    var parser = gen.createParser();
    assert.ok(gen.nonterminals['A'], 'A must be identified as a non-terminal');
    assert.ok(gen.startSymbol, 'A default startsymbol must be picked by Jison');
    assert.ok(gen.startSymbol === 'A', 'The default startsymbol must match the first rule');
};

exports["test start symbol should be nonterminal"] = function () {

    var grammar = {
        tokens: "x y",
        startSymbol: "x",
        bnf: {
            "A" :"A x | A y | "
        }
    };

    assert.throws(function () { new Jison.Generator(grammar); }, "throws error");
};

exports["test token list as string"] = function () {

    var grammar = {
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :"A x | A y | "
        }
    };

    var gen = new Jison.Generator(grammar);
    assert.ok(gen.terminals.indexOf('x') >= 0);
};

exports["test grammar options"] = function () {

    var grammar = {
        options: {type: "slr"},
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :[ 'A x',
                   'A y',
                   ''      ]
        }
    };

    var gen = new Jison.Generator(grammar);
    assert.ok(gen);
    assert.ok(gen.options);
    assert.ok(gen.options.type);
    assert.ok(gen.options.type === 'slr');
};

exports["test overwrite grammar options"] = function () {

    var grammar = {
        options: {type: "slr"},
        tokens: "x y",
        startSymbol: "A",
        bnf: {
            "A" :[ 'A x',
                   'A y',
                   ''      ]
        }
    };

    var gen = new Jison.Generator(grammar, {type: "lr0"});
    assert.ok(gen);
    assert.ok(gen.options);
    assert.ok(gen.options.type);
    assert.ok(gen.options.type === 'lr0');
    assert.equal(gen.constructor, Jison.LR0Generator);
};

exports["test yy shared scope"] = function () {
    var lexData = {
        rules: [
           ["x", "return 'x';"],
           ["y", "return yy.xed ? 'yfoo' : 'ybar';"]
        ]
    };
    var grammar = {
        tokens: "x yfoo ybar",
        startSymbol: "A",
        bnf: {
            "A" :[[ 'A x', "yy.xed = true;" ],
                  [ 'A yfoo', " return 'foo';" ],
                  [ 'A ybar', " return 'bar';" ],
                   ''      ]
        }
    };

    var parser = new Jison.Parser(grammar, {type: "lr0"});
    parser.lexer = new Lexer(lexData);
    assert.equal(parser.parse('y'), "bar", "should return bar");
    assert.equal(parser.parse('xxy'), "foo", "should return foo");
};


exports["test optional token declaration"] = function () {

    var grammar = {
        options: {type: "slr"},
        bnf: {
            "A" :[ 'A x',
                   'A y',
                   ''      ]
        }
    };

    var gen = new Jison.Generator(grammar, {type: "lr0"});
    assert.equal(gen.constructor, Jison.LR0Generator);
};


exports["test custom parse error method"] = function () {
    var lexData = {
        rules: [
           ["a", "return 'a';"],
           ["b", "return 'b';"],
           ["c", "return 'c';"],
           ["d", "return 'd';"],
           ["g", "return 'g';"]
        ]
    };
    var grammar = {
        "tokens": "a b c d g",
        "startSymbol": "S",
        "bnf": {
            "S" :[ "a g d",
                   "a A c",
                   "b A d",
                   "b g c" ],
            "A" :[ "B" ],
            "B" :[ "g" ]
        }
    };

    var parser = new Jison.Parser(grammar, {type: "lalr"});
    parser.lexer = new Lexer(lexData);
    var result = {};
    parser.yy.parseError = function (str, hash) {
        result = hash;
        throw str;
    };

    assert.throws(function () { parser.parse("aga"); });
    assert.strictEqual(result.text, "a", "parse error text should equal b");
    assert.strictEqual(typeof result.token, 'string', "parse error token should be a string");
    assert.strictEqual(result.line, 0, "hash should include line number");
};

exports["test jison grammar as string"] = function () {

    var grammar = "%% A : A x | A y | ;"

    var parser = new Jison.Generator(grammar).createParser();
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test no default resolve"] = function () {
    var grammar = {
        tokens: [ 'x' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
            ''      ]
        }
    };

    var gen = new Jison.Generator(grammar, {type: "lr0", noDefaultResolve: true});
    var parser = gen.createParser();
    parser.lexer = new Lexer(lexData);

    assert.ok(gen.table.length === 4, "table has 4 states");
    assert.ok(gen.conflicts === 2, "encountered 2 conflicts");
    assert.throws(function () { parser.parse("xx"); }, "throws parse error for multiple actions");
};


exports["test EOF in 'Unexpected token' error message"] = function () {

    var grammar = {
        bnf: {
            "A" :[ 'x x y' ]
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    parser.lexer.showPosition = null; // needed for "Unexpected" message
    parser.yy.parseError = function (str, hash) {
        assert.ok(str.match("end of input"));
        // as we override the default parseError(),
        // the default behaviour of throwing an exception is not available now;
        // instead the parser will return our return value:
        if ('expected' in hash) {
            return 666; // parser error
        } else {
            return 7;   // lexer error
        }
    };

    assert.ok(parser.parse("xx") === 666, "on error, the parseError return value is the parse result");
};

exports["test whether default parser error handling throws an exception"] = function () {

    var grammar = {
        bnf: {
            "A" :[ 'x x y' ]
        }
    };

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    parser.lexer.showPosition = null; // needed for "Unexpected" message

    assert.throws(function () { parser.parse("xx"); });
};

exports["test locations"] = function () {
    var grammar = {
        tokens: [ 'x', 'y' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
                   ['y', 'return @1'],
            ''      ]
        }
    };

    var lexData = {
        rules: [
           ["\\s", "/*ignore*/"],
           ["x", "return 'x';"],
           ["y", "return 'y';"]
        ]
    };
    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = new Lexer(lexData);
    var loc = parser.parse('xx\nxy');

    assert.equal(loc.first_line, 2, 'first line correct');
    assert.equal(loc.last_line, 2, 'last line correct');
    assert.equal(loc.first_column, 1, 'first column correct');
    assert.equal(loc.last_column, 2, 'last column correct');
};

exports["test default location action"] = function () {
    var grammar = {
        tokens: [ 'x', 'y' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
                  ['y', 'return @$'],
            ''      ]
        }
    };

    var lexData = {
        rules: [
           ["\\s", "/*ignore*/"],
           ["x", "return 'x';"],
           ["y", "return 'y';"]
        ]
    };
    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = new Lexer(lexData);
    var loc = parser.parse('xx\nxy');

    assert.equal(loc.first_line, 2, 'first line correct');
    assert.equal(loc.last_line, 2, 'last line correct');
    assert.equal(loc.first_column, 1, 'first column correct');
    assert.equal(loc.last_column, 2, 'last column correct');
};

exports["test locations by term name in action"] = function () {
    var grammar = {
        tokens: [ 'x', 'y' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
                  ['B', 'return @B'],
            ''      ],
            "B" :[ 'y' ]
        }
    };

    var lexData = {
        rules: [
           ["\\s", "/*ignore*/"],
           ["x", "return 'x';"],
           ["y", "return 'y';"]
        ]
    };
    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = new Lexer(lexData);
    var loc = parser.parse('xx\nxy');

    assert.equal(loc.first_line, 2, 'first line correct');
    assert.equal(loc.last_line, 2, 'last line correct');
    assert.equal(loc.first_column, 1, 'first column correct');
    assert.equal(loc.last_column, 2, 'last column correct');
};

exports["test lexer with no location support"] = function () {
    var grammar = {
        tokens: [ 'x', 'y' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
                  ['B', 'return @B'],
            ''      ],
            "B" :[ 'y' ]
        }
    };

    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = {
      toks: ['x','x','x','y'],
      lex: function () {
        return this.toks.shift();
      },
      setInput: function () {}
    };
    var loc = parser.parse('xx\nxy');
};

exports["test instance creation"] = function () {
    var grammar = {
        tokens: [ 'x', 'y' ],
        startSymbol: "A",
        bnf: {
            "A" :[ 'x A',
                  ['B', 'return @B'],
            ''      ],
            "B" :[ 'y' ]
        }
    };

    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = {
      toks: ['x','x','x','y'],
      lex: function () {
        return this.toks.shift();
      },
      setInput: function () {}
    };
    var parser2 = new parser.Parser();
    parser2.lexer = parser.lexer;
    parser2.parse('xx\nxy');

    parser.blah = true;

    assert.notEqual(parser.blah, parser2.blah, "should not inherit");
};

exports["test reentrant parsing"] = function () {
    var grammar = {
        bnf: {
            "S" :['A EOF'],
            "A" :['x A',
                  'B',
                  'C'
                 ],
            "B" :[['y', 'return "foo";']],
            "C" :[['w', 'return yy.parser.parse("xxxy") + "bar";']]
        }
    };

    var lexData = {
        rules: [
           ["\\s", "/*ignore*/"],
           ["w", "return 'w';"],
           ["x", "return 'x';"],
           ["y", "return 'y';"],
           ["$", "return 'EOF';"]
        ]
    };
    var gen = new Jison.Generator(grammar);
    var parser = gen.createParser();
    parser.lexer = new Lexer(lexData);
    var result = parser.parse('xxw');
    assert.equal(result, "foobar");
};

exports["test generated parser must have working parse API method"] = function () {
    var grammar = "%% A : A x | A y | ; %%";

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
};

exports["test generated parser must export added user-defined methods"] = function () {
    var grammar = "%% A : A x | A y | ; %% parser.dummy = function () { return 42; };"

    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx");
    assert.ok(typeof parser.dummy === 'function');
    assert.ok(parser.dummy() === 42);
};

exports["test consistent behaviour across many invocations of the parse() API"] = function () {
    var grammar = "%% A : A x | A y | ;"

    // this test should catch the closure error fixed in 
    // SHA-1: 4067a2e900d1e9c3f62a969d4c9a06ce4e124628 :: fix grave bug in 
    // new kernel / APIs cleanupAfterParse et al due to closure mistake
    
    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);
    assert.ok(parser.parse('xyx'), "parse xyx - round 1");
    assert.ok(parser.parse('xyx'), "parse xyx - round 2");
    assert.ok(parser.parse('xyx'), "parse xyx - round 3");
    assert.ok(parser.parse('xyx'), "parse xyx - round 4");
    assert.ok(parser.parse('xyx'), "parse xyx - round 5");
    assert.ok(parser.parse('xyx'), "parse xyx - round 6");
};

exports["test multiple invocations of the cleanupAfterParse API should be survivable"] = function () {
    var grammar = "%options no-try-catch\n%% A : A x | A y | ;"

    // this test should catch the closure error fixed in 
    // SHA-1: 4067a2e900d1e9c3f62a969d4c9a06ce4e124628 :: fix grave bug in 
    // new kernel / APIs cleanupAfterParse et al due to closure mistake
    
    var parser = new Jison.Parser(grammar);
    parser.lexer = new Lexer(lexData);

    assert.ok(typeof parser.cleanupAfterParse !== 'function', 'API will only be present after first call to parse() API');
    assert.ok(!parser.cleanupAfterParse, 'API will only be present after first call to parse() API (null check)');
    assert.ok(parser.parse('xyx'), "parse xyx");
    assert.ok(typeof parser.cleanupAfterParse === 'function', 'API must be present after first call to parse() API');
    assert.doesNotThrow(function () { parser.cleanupAfterParse(); }, 'repetitive invocations of the cleanup API should be fine: round 1');
    assert.doesNotThrow(function () { parser.cleanupAfterParse(); }, 'repetitive invocations of the cleanup API should be fine: round 2');
    assert.doesNotThrow(function () { parser.cleanupAfterParse(); }, 'repetitive invocations of the cleanup API should be fine: round 3');

    // did cleanup reset the API properly?
    assert.ok(typeof parser.parseError === 'function');
    assert.ok(parser.parseError === parser.originalParseError);
    assert.ok(typeof parser.quoteName === 'function');
    assert.ok(parser.quoteName === parser.originalQuoteName);
};
