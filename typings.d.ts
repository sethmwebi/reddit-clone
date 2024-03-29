type Comment = {
	created_at: string
	id: number
	post_id: number
	test: string
	username: string
}

type Vote = {
	created_at: string
	id: number
	post_id: number
	upvote: boolean
	username: string
}

type Subreddit = {
	created_at: string
	id: number
	topic: string
}

type Post = {
	body: string
	created_at: string
	id: number
	image: string
	subreddit_id: number
	title: string
	username: string
	votes: Vote[]
	comments: Comment[]
	subreddit: Subreddit[]
}