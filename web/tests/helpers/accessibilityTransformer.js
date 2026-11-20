module.exports = {
  process(sourceText) {
    return {
      code:
        sourceText +
        '\nif (typeof window !== "undefined") {\n  window.alternarAltoContraste = alternarAltoContraste;\n  window.alternarTamanhoFonte = alternarTamanhoFonte;\n}\n',
    };
  },
};
