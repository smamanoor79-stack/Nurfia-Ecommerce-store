export const filterProducts = (products, filter) => {
  if (filter === "all") return products;
  return products.filter((p) => p.category === filter);
};