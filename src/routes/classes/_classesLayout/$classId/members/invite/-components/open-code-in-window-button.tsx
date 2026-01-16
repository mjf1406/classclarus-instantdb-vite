/** @format */

import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OpenCodeInWindowButtonProps {
    code: string;
    role: "student" | "teacher" | "guardian";
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export function OpenCodeInWindowButton({
    code,
    role,
    className,
    variant = "outline",
    size = "default",
}: OpenCodeInWindowButtonProps) {
    const handleOpenWindow = () => {
        const roleTitle =
            role === "student"
                ? "Student"
                : role === "teacher"
                  ? "Teacher"
                  : "Guardian";

        const logoUrl = `${window.location.origin}/brand/icon-left-of-text-different-sizes-removebg-preview.webp`;

        // Get theme colors from CSS variables
        const root = document.documentElement;
        const getComputedColor = (varName: string) => {
            return (
                getComputedStyle(root).getPropertyValue(varName).trim() || ""
            );
        };

        const primary = getComputedColor("--primary") || "oklch(0.6 0.13 163)";
        const primaryForeground =
            getComputedColor("--primary-foreground") || "oklch(0.98 0.02 166)";
        const accent = getComputedColor("--accent") || "oklch(0.6 0.13 163)";
        const chart2 = getComputedColor("--chart-2") || "oklch(0.77 0.15 163)";

        // Create gradient using theme colors
        const gradientStart = primary;
        const gradientEnd = accent || chart2 || primary;

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${roleTitle} Join Code - ${code}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
            color: ${primaryForeground || "white"};
            padding: 2rem;
            text-align: center;
        }
        .container {
            max-width: 1200px;
            width: 100%;
        }
        .logo {
            width: 400px;
            max-width: 90%;
            height: auto;
            margin-bottom: 3rem;
            filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3));
        }
        .role-badge {
            font-size: 3rem;
            font-weight: 600;
            margin-bottom: 2rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.9;
        }
        .code {
            font-size: 12rem;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.2em;
            margin: 2rem 0;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            line-height: 1;
        }
        .instructions {
            font-size: 3.5rem;
            margin-top: 3rem;
            opacity: 0.9;
            max-width: 1000px;
            margin-left: auto;
            margin-right: auto;
            text-align: left;
        }
        .instructions ol {
            list-style-position: inside;
            padding-left: 0;
        }
        .instructions li {
            margin: 1.5rem 0;
            line-height: 1.4;
        }
        .instructions a {
            color: ${primaryForeground || "white"};
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
        }
        .instructions a:hover {
            opacity: 0.8;
        }
        .url {
            font-size: 1.5rem;
            margin-top: 2rem;
            opacity: 0.8;
            word-break: break-all;
            font-family: 'Courier New', monospace;
        }
        .url a {
            color: ${primaryForeground || "white"};
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
        }
        .url a:hover {
            opacity: 0.8;
        }
        @media (max-width: 768px) {
            .logo {
                width: 250px;
                margin-bottom: 2rem;
            }
            .code {
                font-size: 6rem;
            }
            .role-badge {
                font-size: 2rem;
            }
            .instructions {
                font-size: 2rem;
            }
            .instructions li {
                margin: 1rem 0;
            }
            .url {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="${logoUrl}" alt="ClassClarus Logo" class="logo" />
        <div class="role-badge">${roleTitle} Code</div>
        <div class="code">${code}</div>
        <div class="instructions">
            <ol>
                <li>Open <a href="https://app.classclarus.com/join/class" target="_blank" rel="noopener noreferrer">app.classclarus.com/join/class</a></li>
                <li>Enter the code</li>
                <li>You're in!</li>
            </ol>
        </div>
    </div>
</body>
</html>
        `.trim();

        const newWindow = window.open(
            "",
            "codeDisplay",
            "width=1920,height=1080,fullscreen=yes,scrollbars=no,resizable=yes"
        );

        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            // Try to enter fullscreen if supported
            if (newWindow.document.documentElement.requestFullscreen) {
                newWindow.document.documentElement
                    .requestFullscreen()
                    .catch(() => {
                        // Fullscreen may require user interaction
                    });
            }
        }
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleOpenWindow}
            className={cn("gap-2", className)}
        >
            <Maximize2 className="size-4" />
            Open for Display
        </Button>
    );
}
