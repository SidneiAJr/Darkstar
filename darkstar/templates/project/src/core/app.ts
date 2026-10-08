import { DarkstarApp } from 'darkstar-core'

const app = new DarkstarApp()

app.boot().then(() => app.listen())