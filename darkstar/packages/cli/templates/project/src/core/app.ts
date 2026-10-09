import { DarkstarApp } from '@darkstar-cli/core'

const app = new DarkstarApp()

app.boot().then(() => app.listen())