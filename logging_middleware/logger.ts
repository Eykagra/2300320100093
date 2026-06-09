const TOKEN = process.env.ACCESS_TOKEN?.trim();

export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
) {
  try {
    const response = await fetch(
      "http://4.224.186.213/evaluation-service/logs",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stack,
          level,
          package: pkg,
          message,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);
  }
}
