import { describe, it, expect } from 'vitest'
import { Container } from '@ioc/container'
import { token } from '@ioc/token'

describe('IoC Container', () => {
  it('resolves registered dependencies', () => {
    const NUM = token<number>('num')
    const DEP = token<{ value: number }>('dep')

    class Dep {
      value: number
      constructor(value: unknown) {
        this.value = value as number
      }
    }

    const c = new Container()
    c.register({ token: NUM, useValue: 42 })
    c.register({ token: DEP, useClass: Dep, deps: [NUM] })

    const instance = c.resolve(DEP)
    expect(instance).toBeInstanceOf(Dep)
    expect(instance.value).toBe(42)
  })

  it('returns singletons by default and new instances for transient providers', () => {
    class Foo {}
    const FOO = token<Foo>('foo')

    const singletonContainer = new Container()
    singletonContainer.register({ token: FOO, useClass: Foo })
    const s1 = singletonContainer.resolve(FOO)
    const s2 = singletonContainer.resolve(FOO)
    expect(s1).toBe(s2)

    const transientContainer = new Container()
    transientContainer.register({ token: FOO, useClass: Foo, scope: 'transient' })
    const t1 = transientContainer.resolve(FOO)
    const t2 = transientContainer.resolve(FOO)
    expect(t1).not.toBe(t2)
  })

  it('detects circular dependencies', () => {
    class A { constructor(public b: unknown) {} }
    class B { constructor(public a: unknown) {} }
    const A_TOKEN = token<A>('A')
    const B_TOKEN = token<B>('B')

    const c = new Container()
    c.register({ token: A_TOKEN, useClass: A, deps: [B_TOKEN] })
    c.register({ token: B_TOKEN, useClass: B, deps: [A_TOKEN] })

    expect(() => c.resolve(A_TOKEN)).toThrowError(/IoC circular dependency/)
  })

  it('throws and does not override when registering the same token twice', () => {
    const FOO = token<number>('foo')
    const c = new Container()
    c.register({ token: FOO, useValue: 1 })
    expect(() => c.register({ token: FOO, useValue: 2 })).toThrowError(/already registered/)
    expect(c.resolve(FOO)).toBe(1)
  })
})
