function required(name: string): string {
    const value = process.env[name];

    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value
}

function port(name: string): number {
    const value = Number(required(name));

    if(!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new Error(`${name} must be a port number between 1 and 65535`);
    }

    return value;
}

export const config = {
    apiBaseUrl: required("API_BASE_URL"),
    host: required("HOST"),
    port: port("PORT"),
    publicUrl: required("PUBLIC_URL").replace(/\/+$/, "")
}