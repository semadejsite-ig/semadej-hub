import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SEMADEJ Online - Secretaria de Missões AD Belém SJC",
    template: "%s | SEMADEJ Online"
  },
  description: "Plataforma oficial da Secretaria de Missões da Assembleia de Deus Belém em São José dos Campos. Cursos de Missões (PAM), LIBRAS e gestão missionária.",
  keywords: ["Missões", "SEMADEJ", "AD Belém SJC", "Curso de Missões", "PAM", "LIBRAS", "Assembleia de Deus", "São José dos Campos", "Evangelismo"],
  authors: [{ name: "SEMADEJ Tech Team" }],
  creator: "SEMADEJ",
  publisher: "Assembleia de Deus Belém SJC",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://semadej.com.br",
    title: "SEMADEJ Online - Capacitando para a Grande Comissão",
    description: "Inscreva-se nos cursos do PAM, LIBRAS e participe da obra missionária.",
    siteName: "SEMADEJ Online",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
