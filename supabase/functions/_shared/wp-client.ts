interface WpCredential {
  site_url: string;
  wp_username: string;
  wp_app_password: string;
}

interface WpPostRaw {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  slug: string;
  link: string;
  categories: number[];
  tags: number[];
  date_gmt: string;
}

export interface WpPostParsed {
  wp_post_id: number;
  title: string;
  content: string;
  slug: string;
  permalink: string;
  categories: number[];
  tags: number[];
  published_at: string;
}

const RATE_LIMIT_DELAY = 500; // ms between requests
const MAX_RETRIES = 3;

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = MAX_RETRIES,
  delay = 1000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers });

    if (res.status === 429) {
      const waitTime = delay * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`WP API 인증 실패 (${res.status})`);
      }
      if (res.status === 404) {
        throw new Error("WP REST API가 비활성화되어 있습니다.");
      }
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
    }

    return res;
  }
  throw new Error("WP API 요청 최대 재시도 횟수 초과");
}

export async function fetchAllPosts(
  credential: WpCredential,
  onProgress?: (collected: number, total: number) => void,
): Promise<WpPostParsed[]> {
  const baseUrl = credential.site_url.replace(/\/$/, "");
  const auth = btoa(`${credential.wp_username}:${credential.wp_app_password}`);
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  const allPosts: WpPostParsed[] = [];
  let page = 1;
  let totalPosts = 0;

  while (true) {
    const url = `${baseUrl}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish`;
    const res = await fetchWithRetry(url, headers);

    if (!res.ok) {
      if (page > 1 && res.status === 400) break; // no more pages
      throw new Error(`WP API 오류: ${res.status}`);
    }

    const totalHeader = res.headers.get("X-WP-Total");
    if (totalHeader && page === 1) {
      totalPosts = parseInt(totalHeader, 10);
    }

    const posts: WpPostRaw[] = await res.json();
    if (posts.length === 0) break;

    for (const post of posts) {
      allPosts.push({
        wp_post_id: post.id,
        title: post.title.rendered,
        content: post.content.rendered,
        slug: post.slug,
        permalink: post.link,
        categories: post.categories,
        tags: post.tags,
        published_at: post.date_gmt,
      });
    }

    onProgress?.(allPosts.length, totalPosts || allPosts.length);

    if (posts.length < 100) break;
    page++;

    // Rate limit delay
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
  }

  return allPosts;
}
