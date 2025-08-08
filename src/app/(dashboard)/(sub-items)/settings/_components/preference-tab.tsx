"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Palette, Eye } from "lucide-react";

const Theme = () => {
  const [theme, setTheme] = useState("system");
  const [mounted, setMounted] = useState(false);

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      // System theme
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
          <CardDescription>Loading theme preferences...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded "></div>
            <div className="grid gap-3">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      description: "Light theme with bright backgrounds",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Dark theme with dark backgrounds",
      icon: Moon,
    },
    {
      value: "system",
      label: "System",
      description: "Automatically match your system preference",
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
          <CardDescription>
            Choose how the interface looks and feels. Your theme preference will
            be saved and applied across all sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">Appearance</Label>
            <div className="grid gap-3">
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = theme === option.value;

                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`flex items-start gap-3 p-4 h-auto justify-start ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleThemeChange(option.value)}
                  >
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div
                        className={`text-sm ${
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {option.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Theme Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Sample Interface</h3>
                <Button size="sm" variant="secondary">
                  Action
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                This is how your interface will look with the selected theme.
                Text is clearly readable and elements have proper contrast.
              </p>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded bg-primary"></div>
                <div className="h-8 w-8 rounded bg-secondary"></div>
                <div className="h-8 w-8 rounded bg-muted"></div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-shrink-0">
              {theme === "light" && (
                <Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              )}
              {theme === "dark" && (
                <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              {theme === "system" && (
                <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium">Current theme: </span>
              <span className="capitalize">{theme}</span>
              {theme === "system" && (
                <span className="text-muted-foreground ml-1">
                  (following system preference)
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Theme;
