import path from 'path'
import fs from 'fs'

export class JsonDb {
  private fileName: string

  private cache: any

  private persist: any;

  constructor(persist: boolean = true, dbFilename: string = path.join(process.cwd(), 'deployed.json')) {
    this.fileName = dbFilename
    this.persist = persist;
    if (persist) {
      if (fs.existsSync(dbFilename)) {
        this.cache = JSON.parse(fs.readFileSync(dbFilename).toString())
        this.cache = typeof this.cache !== 'object' ? {} : this.cache
      } else {
        this.cache = {}
      }
    } else {
      this.cache = {}
    }
  }

  public has(key: string): boolean {
    return typeof this.cache[key] !== 'undefined'
  }

  public set(key: string, value: any): void {
    if (typeof this.cache === 'undefined') {
      this.cache = {}
    }
    this.cache[key] = value
    if(this.persist){
      fs.writeFileSync(this.fileName, JSON.stringify(this.cache))
    }
    
  }

  public get<T = any>(key: string): T {
    return typeof this.cache[key] !== 'undefined' ? this.cache[key] : undefined
  }
}
