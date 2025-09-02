"""
Phase 1: FAQ dummy responses
Simple pattern matching for common questions
Following MDC logging guidelines
"""

import re
import logging
from typing import Optional

# Setup logging following MDC guidelines
def create_scoped_logger(scope: str):
    """Create a scoped logger following MDC guidelines"""
    logger = logging.getLogger(f"ai-support-widget.{scope}")
    return logger

logger = create_scoped_logger("faq")

# FAQ database - in production, this could be loaded from a database or JSON file
FAQ_RESPONSES = {
    "cost": {
        "patterns": [
            r"(?i).*price.*",
            r"(?i).*cost.*",
            r"(?i).*how much.*",
            r"(?i).*pricing.*",
            r"(?i).*fee.*",
            r"(?i).*subscription.*",
            r"(?i).*plan.*"
        ],
        "response": "This AI support widget is completely free! You can download the source code, customize it, and deploy it on your own server. The only potential costs are hosting (can be free with many providers) and optional OpenAI API usage if you want advanced AI responses."
    },
    "features": {
        "patterns": [
            r"(?i).*feature.*",
            r"(?i).*what.*do.*",
            r"(?i).*capabilit.*",
            r"(?i).*function.*",
            r"(?i).*what.*can.*"
        ],
        "response": "This tutorial teaches you to build: an embeddable chat widget, FAQ response system, optional AI integration with OpenAI, customizable themes and colors, mobile-responsive design, and easy deployment. Everything is open source and customizable!"
    },
    "integration": {
        "patterns": [
            r"(?i).*integrat.*",
            r"(?i).*connect.*",
            r"(?i).*api.*",
            r"(?i).*setup.*",
            r"(?i).*install.*",
            r"(?i).*implement.*"
        ],
        "response": "Integration is super easy! Just add one script tag to your HTML: `<script src=\"widget/public/embed.js\"></script>`. The tutorial shows you exactly how to customize it for your website and add your own FAQ responses. No complex setup required!"
    },
    "support": {
        "patterns": [
            r"(?i).*support.*",
            r"(?i).*help.*",
            r"(?i).*contact.*",
            r"(?i).*assistance.*",
            r"(?i).*problem.*",
            r"(?i).*issue.*",
            r"(?i).*bug.*"
        ],
        "response": "This is a free tutorial! You can find help in the documentation, GitHub issues, or community forums. The code is open source, so you have full control. Check the README file for troubleshooting and common questions."
    },
    "security": {
        "patterns": [
            r"(?i).*secur.*",
            r"(?i).*privacy.*",
            r"(?i).*data.*protection.*",
            r"(?i).*gdpr.*",
            r"(?i).*complian.*",
            r"(?i).*encrypt.*"
        ],
        "response": "Since you host this yourself, you have complete control over security! The tutorial includes security best practices, input validation, and CORS configuration. Your data stays on your own servers, giving you full privacy and control."
    },
    "getting_started": {
        "patterns": [
            r"(?i).*trial.*",
            r"(?i).*free.*",
            r"(?i).*demo.*",
            r"(?i).*test.*",
            r"(?i).*try.*",
            r"(?i).*start.*",
            r"(?i).*begin.*"
        ],
        "response": "Getting started is easy! 1) Download the tutorial files, 2) Install Python dependencies with 'pip install -r requirements.txt', 3) Run 'python main.py' to start the server, 4) Add the embed script to your website. That's it - your widget is live!"
    },
    "greeting": {
        "patterns": [
            r"(?i)^(hi|hello|hey|good morning|good afternoon|good evening).*",
            r"(?i).*help.*me.*",
            r"(?i)^(what|how).*can.*you.*do.*"
        ],
        "response": "Hello! I'm here to help you learn how to build your own AI support widget. I can answer questions about the tutorial, setup, customization, features, and more. What would you like to know?"
    }
}

def get_faq_response(message: str) -> Optional[str]:
    """
    Check if the message matches any FAQ patterns and return appropriate response
    Following MDC logging guidelines
    
    Args:
        message: User's input message
        
    Returns:
        FAQ response if pattern matches, None otherwise
    """
    if not message or len(message.strip()) < 2:
        logger.warning("Invalid input for FAQ response")
        return None
    
    message = message.strip()
    logger.debug(f"Checking FAQ patterns for message: {message[:50]}...")
    
    # Check each FAQ category
    for category, faq_data in FAQ_RESPONSES.items():
        patterns = faq_data["patterns"]
        response = faq_data["response"]
        
        # Check if any pattern matches
        for pattern in patterns:
            if re.search(pattern, message):
                logger.info(f"FAQ match found in category: {category}")
                return response
    
    logger.debug("No FAQ pattern match found")
    return None

def add_faq_entry(category: str, patterns: list, response: str):
    """
    Add a new FAQ entry (useful for dynamic updates)
    
    Args:
        category: FAQ category name
        patterns: List of regex patterns to match
        response: Response to return when patterns match
    """
    FAQ_RESPONSES[category] = {
        "patterns": patterns,
        "response": response
    }

def get_all_faqs() -> dict:
    """
    Return all FAQ entries (useful for admin/management interfaces)
    """
    return FAQ_RESPONSES
