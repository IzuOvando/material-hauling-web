export const formatPrice = (price: number) => {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

export const formatVolume = (
  volume: number,
  cube?: boolean,
  fixed?: boolean
) => {
  const value = fixed ? volume.toFixed(2) : volume;
  const unit = cube ? "m³" : "L";
  return `${value} ${unit}`;
};
