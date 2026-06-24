export const isVideoUrl = (src: string) => {
  return /^data:video\/|\.(mp4|webm|ogv|ogg|mov|avi|mkv|wmv|3gp)(\?.*)?$/i.test(src);
};

export const isImageUrl = (src: string) => {
  return /^data:image\/|\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(src);
};
