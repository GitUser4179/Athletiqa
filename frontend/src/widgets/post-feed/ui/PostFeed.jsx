import { useEffect, useState } from 'react';
import { listPosts, PostCard } from '../../../enteties/post';
import { useLikePost } from '../../../features/like-post';
import { useCurrentUser } from '../../../shared/lib/useCurrentUser';
import { useTranslation } from 'react-i18next';

// This widget is responsible for fetching and displaying a list of posts.
// It uses the listPosts API function to get the data, maps it to the frontend format, and renders PostCard components.
export function PostFeed({ searchTerm, onPostOpen }) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { handleToggleLike } = useLikePost();
  const { currentUser } = useCurrentUser();
  const isAuthenticated = Boolean(currentUser);

  useEffect(() => {
    async function fetchAndMapPosts() {
      setIsLoading(true); //each loading = loading
      try {
        const rawData = await listPosts(null, searchTerm);
        setPosts(rawData);
      } catch (error) {
        console.error("Failed to load posts", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndMapPosts();
  }, [searchTerm]);

  // Handles toggling a post like.
  // Calls the backend through handleToggleLike, then updates the matching post
  // with the new like count and liked status returned from the server.
  const handlePostLikeToggle = async (postId, isLiked) => {
    try {
      const result = await handleToggleLike(postId, isLiked);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === result.postId
            ? {
              ...post,
              likes: result.likeCount,
              isLiked: result.isLiked,
            }
            : post,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle like", error);
    }
  };

  if (isLoading) {
    console.log("POSTFEED RENDER", { isLoading, posts });
    return <p className="text-center text-gray-500 mt-8">{t("Loading posts...")}</p>;
  }

  if (posts.length === 0) {
    return <p className="text-center text-gray-500 mt-8">{t("No posts found.")}</p>;
  }

  return (
    <div className="w-full min-h-[30rem]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={() => onPostOpen?.(post)}
            onToggleLike={handlePostLikeToggle}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
}
