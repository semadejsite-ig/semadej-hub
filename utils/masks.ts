export const maskPhone = (value: string) => {
    if (!value) return "";

    // Remove non-numeric characters
    value = value.replace(/\D/g, "");

    // Limit to 11 digits
    value = value.substring(0, 11);

    // Apply mask
    if (value.length <= 10) {
        // (NN) NNNN-NNNN
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
        // (NN) NNNNN-NNNN
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
    }

    return value;
};
