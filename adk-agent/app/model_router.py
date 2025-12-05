"""Model routing for adaptive model selection based on query complexity."""

from enum import Enum
from typing import Optional
import re


class QueryComplexity(Enum):
    """Query complexity levels for model routing."""
    SIMPLE = "simple"      # Direct questions, single tool
    MODERATE = "moderate"  # 2-3 tools, some reasoning
    COMPLEX = "complex"    # Multi-step, analysis, many tools


# Keywords that indicate complex queries
COMPLEX_INDICATORS = [
    "analyze", "compare", "evaluate", "recommend", "strategy",
    "plan", "multiple", "all", "comprehensive", "detailed",
    "optimize", "assess", "review", "create a report",
    "step by step", "end to end", "full", "complete"
]

# Keywords that indicate simple queries
SIMPLE_INDICATORS = [
    "what is", "how do", "can you", "show me", "find",
    "search", "get", "who is", "where is", "when",
    "list", "tell me", "explain briefly"
]

# Multi-tool indicators
MULTI_TOOL_PATTERNS = [
    r"and\s+then",
    r"after\s+that",
    r"also\s+(?:search|find|analyze|send|create)",
    r"(?:first|second|third|finally)",
    r"multiple\s+(?:candidates|sources|steps)",
]


def classify_query_complexity(
    message: str,
    history: Optional[list[dict]] = None
) -> QueryComplexity:
    """
    Classify query complexity to route to appropriate model.

    Args:
        message: The user's message to classify
        history: Previous conversation history for context

    Returns:
        QueryComplexity enum value
    """
    message_lower = message.lower()
    history = history or []

    # Count complexity indicators
    complex_count = sum(1 for ind in COMPLEX_INDICATORS if ind in message_lower)
    simple_count = sum(1 for ind in SIMPLE_INDICATORS if ind in message_lower)

    # Check for multi-tool patterns
    multi_tool_count = sum(
        1 for pattern in MULTI_TOOL_PATTERNS
        if re.search(pattern, message_lower)
    )

    # Consider conversation history length (longer conversations often need more reasoning)
    history_complexity = len(history) > 5

    # Consider message length (longer messages often have more complex requests)
    length_factor = len(message) > 300

    # Calculate complexity score
    complexity_score = (
        complex_count * 2 +
        multi_tool_count * 2 -
        simple_count +
        (1 if history_complexity else 0) +
        (1 if length_factor else 0)
    )

    # Classify based on score
    if complexity_score >= 4:
        return QueryComplexity.COMPLEX
    elif complexity_score <= -1 and not multi_tool_count:
        return QueryComplexity.SIMPLE
    else:
        return QueryComplexity.MODERATE


def get_model_for_complexity(complexity: QueryComplexity) -> str:
    """
    Return appropriate Gemini model based on complexity.

    Args:
        complexity: The classified query complexity

    Returns:
        Model identifier string
    """
    model_map = {
        QueryComplexity.SIMPLE: "gemini-2.0-flash",
        QueryComplexity.MODERATE: "gemini-2.0-flash",
        QueryComplexity.COMPLEX: "gemini-2.5-pro"
    }
    return model_map[complexity]


def get_complexity_description(complexity: QueryComplexity) -> str:
    """
    Get a human-readable description of the complexity level.

    Args:
        complexity: The query complexity level

    Returns:
        Description string
    """
    descriptions = {
        QueryComplexity.SIMPLE: "Simple query - direct question or single tool use",
        QueryComplexity.MODERATE: "Moderate query - may involve 2-3 tools",
        QueryComplexity.COMPLEX: "Complex query - multi-step reasoning or analysis required"
    }
    return descriptions[complexity]
