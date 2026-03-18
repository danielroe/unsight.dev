declare module '#auth-utils' {
  interface User {
    githubId: number
    login: string
    avatar: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
