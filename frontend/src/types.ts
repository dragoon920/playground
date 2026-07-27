export type User = {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

export type Item = {
  id: number
  title: string
  done: boolean
  created_at: string
}

export type Job = {
  id: number
  company: string
  role: string
  salary: string
  url: string
  status: 'applied' | 'rejected' | string
  created_at: string
}
