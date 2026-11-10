/**
 * Tiny safe arithmetic evaluator for /calculate (the Python bot used eval(), which ran arbitrary code).
 * Supports + - * / % ** ^ (power), parentheses, unary +/-, constants (pi, e) and common Math functions.
 */

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
}

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, x: 1, y: 1 }

type Token = { type: 'num'; value: number } | { type: 'id'; value: string } | { type: 'op'; value: string }

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
    } else if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(input.slice(i))
      if (!m) throw new Error('bad number')
      tokens.push({ type: 'num', value: parseFloat(m[0]) })
      i += m[0].length
    } else if (/[a-z_]/i.test(ch)) {
      const m = /^[a-z_]\w*/i.exec(input.slice(i))!
      tokens.push({ type: 'id', value: m[0].toLowerCase() })
      i += m[0].length
    } else if (input.startsWith('**', i)) {
      tokens.push({ type: 'op', value: '^' })
      i += 2
    } else if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
    } else {
      throw new Error(`unexpected character ${ch}`)
    }
  }
  return tokens
}

export function evaluate(input: string): number {
  const tokens = tokenize(input)
  let pos = 0

  const peek = () => tokens[pos]
  const isOp = (v: string) => peek()?.type === 'op' && peek()!.value === v
  const expect = (v: string) => {
    if (!isOp(v)) throw new Error(`expected ${v}`)
    pos++
  }

  // expr := term (('+'|'-') term)*
  function expr(): number {
    let v = term()
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value
      v = op === '+' ? v + term() : v - term()
    }
    return v
  }

  // term := unary (('*'|'/'|'%') unary)*
  function term(): number {
    let v = unary()
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = tokens[pos++].value
      const r = unary()
      v = op === '*' ? v * r : op === '/' ? v / r : v % r
    }
    return v
  }

  // unary := ('+'|'-') unary | power
  function unary(): number {
    if (isOp('-')) {
      pos++
      return -unary()
    }
    if (isOp('+')) {
      pos++
      return unary()
    }
    return power()
  }

  // power := atom ('^' unary)?   (right-associative)
  function power(): number {
    const base = atom()
    if (isOp('^')) {
      pos++
      return base ** unary()
    }
    return base
  }

  function atom(): number {
    const t = peek()
    if (!t) throw new Error('unexpected end')
    if (t.type === 'num') {
      pos++
      return t.value
    }
    if (t.type === 'id') {
      pos++
      if (t.value in FUNCTIONS) {
        expect('(')
        const arg = expr()
        expect(')')
        return FUNCTIONS[t.value](arg)
      }
      if (t.value in CONSTANTS) return CONSTANTS[t.value]
      throw new Error(`unknown name ${t.value}`)
    }
    if (isOp('(')) {
      pos++
      const v = expr()
      expect(')')
      return v
    }
    throw new Error('unexpected token')
  }

  const result = expr()
  if (pos !== tokens.length) throw new Error('trailing input')
  return result
}
