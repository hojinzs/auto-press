export async function testWordPressConnection(url: string, username: string, appPassword: string) {
  try {
    // URL 정리 (트레일링 슬래시 제거)
    const baseUrl = url.replace(/\/$/, "");
    const testUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=1`;

    // Basic Auth header 생성
    const credentials = btoa(`${username}:${appPassword}`);
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || `HTTP 오류: ${response.status}`,
        code: errorData.code
      };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message || "연결 중 오류가 발생했습니다." 
    };
  }
}
