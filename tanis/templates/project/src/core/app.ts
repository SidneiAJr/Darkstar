import { TanisApp } from '@tanis/core'

const app = new TanisApp()

app.boot().then(() => app.listen())
