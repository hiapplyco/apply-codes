#!/bin/bash
# Pre-commit hook for Apply.codes
# Ensures code quality before allowing commits

echo "🔍 Running pre-commit checks for Apply.codes..."

# Check for TypeScript errors
echo "📝 Checking TypeScript..."
npm run typecheck --silent
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix before committing."
    exit 1
fi

# Run linting
echo "🎨 Running ESLint..."
npm run lint --silent
if [ $? -ne 0 ]; then
    echo "❌ Linting errors found. Please fix before committing."
    exit 1
fi

# Check for hardcoded secrets
echo "🔐 Checking for secrets..."
grep -r "sk-\|key-\|api_key\|API_KEY" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist . | grep -v "env\|process.env\|import.meta.env"
if [ $? -eq 0 ]; then
    echo "❌ Potential secrets found in code. Please use environment variables."
    exit 1
fi

# Check for console.log statements
echo "🔍 Checking for console.log statements..."
grep -r "console.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . | grep -v "// console.log"
if [ $? -eq 0 ]; then
    echo "⚠️  Warning: console.log statements found. Consider removing for production."
fi

# Check for TODO comments
echo "📋 Checking for TODOs..."
grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist . | head -5
if [ $? -eq 0 ]; then
    echo "ℹ️  Note: TODO comments found. Remember to address them."
fi

echo "✅ Pre-commit checks passed!"