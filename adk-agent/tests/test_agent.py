"""Tests for the ADK agent configuration and model routing."""

import pytest
from app.agent import create_agent, get_agent_capabilities
from app.model_router import (
    classify_query_complexity,
    QueryComplexity,
    get_model_for_complexity
)


class TestQueryComplexityClassification:
    """Test query complexity classification."""

    def test_simple_query(self):
        """Test classification of simple queries."""
        simple_queries = [
            "What is the best boolean search for engineers?",
            "Find me developers in San Francisco",
            "Show me the compensation for this role",
            "Search for candidates with Python skills",
        ]

        for query in simple_queries:
            complexity = classify_query_complexity(query)
            assert complexity in [QueryComplexity.SIMPLE, QueryComplexity.MODERATE], \
                f"Expected simple/moderate for: {query}"

    def test_complex_query(self):
        """Test classification of complex queries."""
        complex_queries = [
            "Analyze and compare all candidates then recommend the top 3 with a detailed strategy",
            "Create a comprehensive sourcing plan with multiple boolean searches and outreach templates",
            "Evaluate all candidates, analyze compensation data, and create a detailed report with recommendations",
        ]

        for query in complex_queries:
            complexity = classify_query_complexity(query)
            assert complexity == QueryComplexity.COMPLEX, \
                f"Expected complex for: {query}"

    def test_multi_tool_detection(self):
        """Test detection of multi-tool queries."""
        multi_tool_queries = [
            "First search for candidates, and then enrich their profiles",
            "Find the job requirements, after that generate a boolean search",
            "Search for engineers and also send them outreach emails",
        ]

        for query in multi_tool_queries:
            complexity = classify_query_complexity(query)
            assert complexity in [QueryComplexity.MODERATE, QueryComplexity.COMPLEX], \
                f"Expected moderate/complex for multi-tool: {query}"

    def test_history_affects_complexity(self):
        """Test that long conversation history increases complexity."""
        query = "Continue with the analysis"
        short_history = [{"role": "user", "content": "Hi"}] * 3
        long_history = [{"role": "user", "content": "Hi"}] * 10

        short_complexity = classify_query_complexity(query, short_history)
        long_complexity = classify_query_complexity(query, long_history)

        # Long history should not decrease complexity
        assert long_complexity.value >= short_complexity.value or \
               long_complexity == short_complexity


class TestModelRouting:
    """Test model selection based on complexity."""

    def test_model_for_simple(self):
        """Test model selection for simple queries."""
        model = get_model_for_complexity(QueryComplexity.SIMPLE)
        assert "flash" in model.lower()

    def test_model_for_complex(self):
        """Test model selection for complex queries."""
        model = get_model_for_complexity(QueryComplexity.COMPLEX)
        assert "pro" in model.lower()


class TestAgentCreation:
    """Test agent creation and configuration."""

    def test_create_basic_agent(self):
        """Test creating agent without context."""
        agent = create_agent()
        assert agent is not None
        assert agent.name == "apply_codes_agent"
        assert len(agent.tools) > 0

    def test_create_agent_with_project_context(self):
        """Test creating agent with project context."""
        project_context = {
            "name": "Test Project",
            "description": "Test description",
            "requirements": "Python, React",
            "candidate_count": 5
        }

        agent = create_agent(project_context=project_context)
        assert agent is not None
        assert "Test Project" in agent.instruction

    def test_create_agent_with_complexity(self):
        """Test creating agent with different complexity levels."""
        simple_agent = create_agent(complexity=QueryComplexity.SIMPLE)
        complex_agent = create_agent(complexity=QueryComplexity.COMPLEX)

        assert "flash" in simple_agent.model.lower()
        assert "pro" in complex_agent.model.lower()


class TestAgentCapabilities:
    """Test agent capabilities reporting."""

    def test_get_capabilities(self):
        """Test getting agent capabilities."""
        capabilities = get_agent_capabilities()

        assert "name" in capabilities
        assert "capabilities" in capabilities
        assert "tool_count" in capabilities
        assert capabilities["tool_count"] > 0

    def test_capabilities_categories(self):
        """Test that all expected categories are present."""
        capabilities = get_agent_capabilities()
        category_names = [c["category"] for c in capabilities["capabilities"]]

        expected_categories = [
            "Candidate Sourcing",
            "Job Analysis",
            "Outreach",
            "Interview",
            "Documents",
            "Analytics"
        ]

        for expected in expected_categories:
            assert expected in category_names, f"Missing category: {expected}"
