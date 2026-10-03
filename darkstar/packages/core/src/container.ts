// -----------------------------------------------
// Tanis Container — IoC simples estilo Laravel
// -----------------------------------------------

type Constructor<T = any> = new (...args: any[]) => T

class TanisContainer {
  private bindings = new Map<string, Constructor>()
  private instances = new Map<string, any>()

  // Registra uma classe no container
  bind<T>(abstract: string | Constructor<T>, concrete: Constructor<T>) {
    const key = typeof abstract === 'string' ? abstract : abstract.name
    this.bindings.set(key, concrete)
  }

  // Resolve uma classe e suas dependências automaticamente
  make<T>(abstract: string | Constructor<T>): T {
    const key = typeof abstract === 'string' ? abstract : abstract.name

    // Singleton — retorna instância já criada
    if (this.instances.has(key)) {
      return this.instances.get(key)
    }

    const concrete = this.bindings.get(key) ?? (abstract as Constructor<T>)

    // Lê os parâmetros do construtor pelo nome da classe
    const deps = this.resolveDeps(concrete)
    const instance = new concrete(...deps)

    return instance
  }

  // Singleton — resolve uma vez e reutiliza
  singleton<T>(abstract: string | Constructor<T>, concrete: Constructor<T>) {
    const key = typeof abstract === 'string' ? abstract : abstract.name
    this.bindings.set(key, concrete)
    const deps = this.resolveDeps(concrete)
    this.instances.set(key, new concrete(...deps))
  }

  // Resolve dependências pelo nome dos parâmetros do construtor
  private resolveDeps(concrete: Constructor): any[] {
    const str = concrete.toString()

    // Extrai parâmetros do constructor
    const match = str.match(/constructor\s*\(([^)]*)\)/)
    if (!match || !match[1].trim()) return []

    const params = match[1]
      .split(',')
      .map(p => p.trim().replace(/^private\s+|^public\s+|^protected\s+|^readonly\s+/g, ''))
      .map(p => p.split(':')[0].trim()) // remove tipo TypeScript
      .filter(Boolean)

    return params.map(param => {
      // Converte nome do parâmetro pra nome da classe
      // ex: userService -> UserService, userRepository -> UserRepository
      const className = param.charAt(0).toUpperCase() + param.slice(1)
      return this.make(className)
    })
  }
}

export const Container = new TanisContainer()