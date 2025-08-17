"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contentStore } from "@/lib/contentStore";

export default function DebugPage() {
    const [localStorageContent, setLocalStorageContent] = useState<string>("");
    const [testData, setTestData] = useState<string>("");

    useEffect(() => {
        // Check localStorage content
        const content = localStorage.getItem('tempArticleContent');
        setLocalStorageContent(content || "No content found");
    }, []);

    const testLocalStorage = () => {
        try {
            const testObj = {
                test: true,
                timestamp: new Date().toISOString(),
                data: testData
            };
            localStorage.setItem('tempArticleContent', JSON.stringify(testObj));
            alert('Test data stored in localStorage!');

            // Refresh the display
            const content = localStorage.getItem('tempArticleContent');
            setLocalStorageContent(content || "No content found");
        } catch (error) {
            alert(`Error storing test data: ${error}`);
        }
    };

    const clearLocalStorage = () => {
        try {
            localStorage.removeItem('tempArticleContent');
            setLocalStorageContent("No content found");
            alert('localStorage cleared!');
        } catch (error) {
            alert(`Error clearing localStorage: ${error}`);
        }
    };

    const testNavigation = () => {
        try {
            // Test if we can navigate to the article page
            window.location.href = '/article/test-123';
        } catch (error) {
            alert(`Error navigating: ${error}`);
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 p-8'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-3xl font-bold mb-8'>Debug Page</h1>

                <div className='grid gap-6'>
                    {/* localStorage Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>localStorage Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <div>
                                    <Label>Current localStorage content:</Label>
                                    <pre className='bg-gray-100 p-3 rounded mt-2 text-sm overflow-auto max-h-40'>
                                        {localStorageContent}
                                    </pre>
                                </div>
                                <div className='flex gap-2'>
                                    <Button onClick={clearLocalStorage} variant='outline'>
                                        Clear localStorage
                                    </Button>
                                    <Button onClick={() => window.location.reload()}>
                                        Refresh Page
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test localStorage */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Test localStorage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <div>
                                    <Label htmlFor='testData'>Test Data:</Label>
                                    <Input
                                        id='testData'
                                        value={testData}
                                        onChange={(e) => setTestData(e.target.value)}
                                        placeholder='Enter test data...'
                                    />
                                </div>
                                <Button onClick={testLocalStorage}>
                                    Store Test Data in localStorage
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Navigation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Navigation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <p className='text-sm text-muted-foreground'>
                                    Test if navigation to article pages works
                                </p>
                                <Button onClick={testNavigation} variant='outline'>
                                    Navigate to /article/test-123
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Browser Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Browser Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2 text-sm'>
                                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                                <p><strong>localStorage available:</strong> {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</p>
                                <p><strong>sessionStorage available:</strong> {typeof sessionStorage !== 'undefined' ? 'Yes' : 'No'}</p>
                                <p><strong>Current URL:</strong> {window.location.href}</p>
                                <p><strong>Current pathname:</strong> {window.location.pathname}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Store Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Store Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <div>
                                    <Label>Content Store Size:</Label>
                                    <p className='text-sm text-muted-foreground mt-1'>
                                        {contentStore.getSize()} items stored
                                    </p>
                                </div>
                                <Button onClick={() => contentStore.clear()} variant='outline'>
                                    Clear Content Store
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
