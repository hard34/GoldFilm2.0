export const validateInput = (input) => {
  return /^\S+@\S+\.\S+$/.test(input);
};
