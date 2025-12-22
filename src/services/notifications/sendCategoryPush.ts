type SendCategoryPushParams = {
  title: string;
  message: string;
  url: string;
  categoryId: string;
  storeId: string;
  productId?: string;
};

export async function sendCategoryPush(data: SendCategoryPushParams) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-category-alert`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        url: data.url,
        category_id: data.categoryId,
        store_id: data.storeId,
        product_id: data.productId
      })
    }
  );

  if (!res.ok) {
    throw new Error("Erro ao enviar push");
  }

  return res.json();
}
