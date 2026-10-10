// -----------------------------------------------
// Tanis Container — IoC simples estilo Laravel
// -----------------------------------------------

type Constructor<T = any> = new (...args: any[]) => T

export class TanisContainer {
  private bindings = new Map<string, Constructor>()
  private instances = new Map<string, any>()

  bind<T>(abstract: string | Constructor<T>, concrete: Constructor<T>) {
    const key = typeof abstract === 'string' ? abstract : abstract.name
    this.bindings.set(key, concrete)
  }

  make<T>(abstract: string | Constructor<T>): T {
    const key = typeof abstract === 'string' ? abstract : abstract.name

    if (this.instances.has(key)) {
      return this.instances.get(key)
    }

    const concrete = this.bindings.get(key) ?? (abstract as Constructor<T>)
    const deps = this.resolveDeps(concrete)
    const instance = new concrete(...deps)

    return instance
  }

  singleton<T>(abstract: string | Constructor<T>, concrete: Constructor<T>) {
    const key = typeof abstract === 'string' ? abstract : abstract.name
    this.bindings.set(key, concrete)
    const deps = this.resolveDeps(concrete)
    this.instances.set(key, new concrete(...deps))
  }

  private resolveDeps(concrete: Constructor): any[] {
    const str = concrete.toString()

    const match = str.match(/constructor\s*\(([^)]{0,500})\)/)
    if (!match || !match[1].trim()) return []

    const params = match[1]
      .split(',')
      .map(p => p.trim().replace(/^(?:private|public|protected|readonly)\s+/, ''))
      .map(p => p.split(':')[0].trim())
      .filter(Boolean)

    return params.map(param => {
      const className = param.charAt(0).toUpperCase() + param.slice(1)
      return this.make(className)
    })
  }
}

export const Container = new TanisContainer()