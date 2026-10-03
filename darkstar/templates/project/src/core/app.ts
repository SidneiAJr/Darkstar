import { TanisApp } from '@darkstar/core'

const app = new TanisApp()

app.boot().then(() => app.listen())