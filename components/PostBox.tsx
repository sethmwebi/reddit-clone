import { useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";
import { LinkIcon, PhotographIcon } from "@heroicons/react/outline";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { ADD_POST } from "../graphql/mutations";
import client from "../apollo-client";
import { GET_SUBREDDIT_BY_TOPIC, GET_ALL_POSTS } from "../graphql/queries";
import { ADD_SUBREDDIT } from "../graphql/mutations";
import toast from "react-hot-toast";

type FormData = {
	postTitle: string;
	postBody: string;
	postImage: string;
	subreddit: string;
};

type Props = {
	subreddit?: string;
};

const PostBox = ({ subreddit }: Props) => {
	const { data: session } = useSession();
	const [imageBoxOpen, setImageBoxOpen] = useState<boolean>(false);
	const [addPost] = useMutation(ADD_POST, {
		refetchQueries: [GET_ALL_POSTS, "getPostList"],
	});
	const [addSubreddit] = useMutation(ADD_SUBREDDIT);

	const {
		register,
		setValue,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormData>();

	const onSubmit = handleSubmit(async (formData) => {
		const notification = toast.loading("Creating new post...");
		try {
			// Query fro the subreddit topic
			const {
				data: { getSubredditListByTopic },
			} = await client.query({
				query: GET_SUBREDDIT_BY_TOPIC,
				variables: {
					topic: subreddit || formData.subreddit,
				},
			});


			const subredditExists = getSubredditListByTopic.length > 0;

			if (!subredditExists) {
				// create a subreddit
				const {
					data: { insertSubreddit: newSubreddit },
				} = await addSubreddit({
					variables: {
						topic: formData.subreddit,
					},
				});

				const image = formData.postImage || "";

				const {
					data: { insertPost: newPost },
				} = await addPost({
					variables: {
						body: formData.postBody,
						image: image,
						subreddit_id: newSubreddit.id,
						title: formData.postTitle,
						username: session?.user?.name,
					},
				});
			} else {
				// use existing subreddit
				const image = formData.postImage || "";

				const {
					data: { insertPost: newPost },
				} = await addPost({
					variables: {
						body: formData.postBody,
						image: image,
						subreddit_id: getSubredditListByTopic[0].id,
						title: formData.postTitle,
						username: session?.user?.name,
					},
				});
			}

			setValue("postTitle", "");
			setValue("postBody", "");
			setValue("postImage", "");
			setValue("subreddit", "");

			toast.success("New toast created!", {
				id: notification,
			});
		} catch (error) {
			toast.error("Whoops something went wrong!", {
				id: notification,
			});
		}
	});
	return (
		<form
			onSubmit={onSubmit}
			className="sticky top-20 z-50 bg-white border border-gray-300 rounded-md p-2"
		>
			<div className="flex items-center space-x-3">
				{/*Avatar*/}
				<Avatar />
				<input
					{...register("postTitle", { required: true })}
					type="text"
					disabled={!session}
					className="bg-gray-50 p-2 pl-5 outline-none rounded-md flex-1"
					placeholder={
						session
							? subreddit
								? `Create a post in r/${subreddit}`
								: `Create a post by entering a title`
							: "Sign in to post"
					}
				/>
				<PhotographIcon
					onClick={() => setImageBoxOpen(!imageBoxOpen)}
					className={`h-6 text-gray-300 cursor-pointer ${
						imageBoxOpen && "text-blue-300"
					}`}
				/>
				<LinkIcon className="h-6 text-gray-300" />
			</div>
			{!!watch("postTitle") && (
				<div className="flex flex-col py-2">
					{/*body*/}
					<div className="flex items-center px-2">
						<p className="min-w-[90px]">Body:</p>
						<input
							className="m-2 flex-1 bg-blue-50 outline-none"
							{...register("postBody")}
							type="text"
							placeholder="Text (optional)"
						/>
					</div>

					{!subreddit && (
						<div className="flex items-center px-2">
							<p className="min-w-[90px]">Subreddit:</p>
							<input
								className="m-2 flex-1 bg-blue-50 outline-none"
								{...register("subreddit", { required: true })}
								type="text"
								placeholder="i.e. reactjs"
							/>
						</div>
					)}

					{imageBoxOpen && (
						<div className="flex items-center px-2">
							<p className="min-w-[90px]">Image URL:</p>
							<input
								className="m-2 flex-1 bg-blue-50 outline-none"
								{...register("postImage")}
								type="text"
								placeholder="Optional..."
							/>
						</div>
					)}

					{/*Errors*/}
					{Object.keys(errors).length > 0 && (
						<div className="space-y-2 p-2 text-red-500">
							{errors.postTitle?.type === "required" && (
								<p>- A Post Title is required.</p>
							)}

							{errors.subreddit?.type === "required" && (
								<p>- A Subreddit is required</p>
							)}
						</div>
					)}
					{!!watch("postTitle") && (
						<button
							type="submit"
							className="w-full rounded-full bg-blue-400 p-2 text-white"
						>
							Create Post
						</button>
					)}
				</div>
			)}
		</form>
	);
};

export default PostBox;
