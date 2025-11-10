#!/bin/bash

##############################################################################
# OpenAPI Validation Script
#
# Runs multiple validators against backend/openapi.yml and generates reports
#
# Usage:
#   ./backend/validate_openapi.sh [--install]
#
# Options:
#   --install    Install validation tools before running
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OPENAPI_FILE="$SCRIPT_DIR/openapi.yml"
DOCS_DIR="$PROJECT_ROOT/docs"
REPORT_DIR="$DOCS_DIR/openapi_reports"

# Create reports directory
mkdir -p "$REPORT_DIR"

# Timestamp for reports
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

##############################################################################
# Functions
##############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

install_tools() {
    print_header "Installing Validation Tools"

    # Check for npm
    if ! check_command npm; then
        print_error "npm not found. Please install Node.js and npm first."
        exit 1
    fi

    # Install Spectral
    print_info "Installing @stoplight/spectral-cli..."
    npm install -g @stoplight/spectral-cli

    # Install Swagger CLI
    print_info "Installing @apidevtools/swagger-cli..."
    npm install -g @apidevtools/swagger-cli

    # Install Redoc CLI (for docs generation)
    print_info "Installing @redocly/cli..."
    npm install -g @redocly/cli

    # Check for yamllint
    if ! check_command yamllint; then
        print_warning "yamllint not found. Install with: brew install yamllint (macOS)"
    fi

    print_success "Validation tools installed"
}

##############################################################################
# Validation Functions
##############################################################################

validate_yaml_syntax() {
    print_header "1. YAML Syntax Check"

    if check_command yamllint; then
        print_info "Running yamllint..."
        if yamllint "$OPENAPI_FILE" > "$REPORT_DIR/yamllint_$TIMESTAMP.txt" 2>&1; then
            print_success "YAML syntax is valid"
            cat "$REPORT_DIR/yamllint_$TIMESTAMP.txt"
        else
            print_error "YAML syntax errors found"
            cat "$REPORT_DIR/yamllint_$TIMESTAMP.txt"
            return 1
        fi
    else
        print_warning "yamllint not installed, skipping YAML syntax check"
    fi
}

validate_with_spectral() {
    print_header "2. Spectral Validation (OpenAPI Linter)"

    if check_command spectral; then
        print_info "Running Spectral..."
        print_info "Output saved to: $REPORT_DIR/spectral_$TIMESTAMP.txt"

        if spectral lint "$OPENAPI_FILE" --format pretty > "$REPORT_DIR/spectral_$TIMESTAMP.txt" 2>&1; then
            print_success "Spectral validation passed with no errors"
            cat "$REPORT_DIR/spectral_$TIMESTAMP.txt"
        else
            print_warning "Spectral found issues (see report for details)"
            cat "$REPORT_DIR/spectral_$TIMESTAMP.txt"

            # Count errors and warnings
            ERROR_COUNT=$(grep -c "error" "$REPORT_DIR/spectral_$TIMESTAMP.txt" || true)
            WARNING_COUNT=$(grep -c "warning" "$REPORT_DIR/spectral_$TIMESTAMP.txt" || true)

            print_info "Errors: $ERROR_COUNT, Warnings: $WARNING_COUNT"
            return 1
        fi
    else
        print_error "Spectral not installed. Run: npm install -g @stoplight/spectral-cli"
        return 1
    fi
}

validate_with_swagger() {
    print_header "3. Swagger CLI Validation"

    if check_command swagger-cli; then
        print_info "Running Swagger CLI..."

        if swagger-cli validate "$OPENAPI_FILE" > "$REPORT_DIR/swagger_cli_$TIMESTAMP.txt" 2>&1; then
            print_success "Swagger CLI validation passed"
            cat "$REPORT_DIR/swagger_cli_$TIMESTAMP.txt"
        else
            print_error "Swagger CLI validation failed"
            cat "$REPORT_DIR/swagger_cli_$TIMESTAMP.txt"
            return 1
        fi
    else
        print_warning "Swagger CLI not installed. Run: npm install -g @apidevtools/swagger-cli"
    fi
}

validate_with_redocly() {
    print_header "4. Redocly Validation"

    if check_command redocly; then
        print_info "Running Redocly lint..."

        if redocly lint "$OPENAPI_FILE" > "$REPORT_DIR/redocly_$TIMESTAMP.txt" 2>&1; then
            print_success "Redocly validation passed"
            cat "$REPORT_DIR/redocly_$TIMESTAMP.txt"
        else
            print_warning "Redocly found issues"
            cat "$REPORT_DIR/redocly_$TIMESTAMP.txt"
            return 1
        fi
    else
        print_warning "Redocly CLI not installed. Run: npm install -g @redocly/cli"
    fi
}

generate_summary() {
    print_header "Validation Summary"

    SUMMARY_FILE="$REPORT_DIR/validation_summary_$TIMESTAMP.txt"

    {
        echo "OpenAPI Validation Report"
        echo "Generated: $(date)"
        echo "File: $OPENAPI_FILE"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        # YAML Syntax
        echo "1. YAML Syntax Check:"
        if [ -f "$REPORT_DIR/yamllint_$TIMESTAMP.txt" ]; then
            if [ -s "$REPORT_DIR/yamllint_$TIMESTAMP.txt" ]; then
                echo "   Status: ISSUES FOUND"
                echo "   See: yamllint_$TIMESTAMP.txt"
            else
                echo "   Status: ✓ PASS"
            fi
        else
            echo "   Status: NOT RUN"
        fi
        echo ""

        # Spectral
        echo "2. Spectral Validation:"
        if [ -f "$REPORT_DIR/spectral_$TIMESTAMP.txt" ]; then
            ERROR_COUNT=$(grep -c "error" "$REPORT_DIR/spectral_$TIMESTAMP.txt" || echo "0")
            WARNING_COUNT=$(grep -c "warning" "$REPORT_DIR/spectral_$TIMESTAMP.txt" || echo "0")
            echo "   Errors: $ERROR_COUNT"
            echo "   Warnings: $WARNING_COUNT"
            echo "   See: spectral_$TIMESTAMP.txt"
        else
            echo "   Status: NOT RUN"
        fi
        echo ""

        # Swagger CLI
        echo "3. Swagger CLI Validation:"
        if [ -f "$REPORT_DIR/swagger_cli_$TIMESTAMP.txt" ]; then
            if grep -q "is valid" "$REPORT_DIR/swagger_cli_$TIMESTAMP.txt"; then
                echo "   Status: ✓ PASS"
            else
                echo "   Status: FAILED"
                echo "   See: swagger_cli_$TIMESTAMP.txt"
            fi
        else
            echo "   Status: NOT RUN"
        fi
        echo ""

        # Redocly
        echo "4. Redocly Validation:"
        if [ -f "$REPORT_DIR/redocly_$TIMESTAMP.txt" ]; then
            if grep -q "0 problems" "$REPORT_DIR/redocly_$TIMESTAMP.txt"; then
                echo "   Status: ✓ PASS"
            else
                echo "   Status: ISSUES FOUND"
                echo "   See: redocly_$TIMESTAMP.txt"
            fi
        else
            echo "   Status: NOT RUN"
        fi
        echo ""

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "All reports saved to: $REPORT_DIR/"

    } > "$SUMMARY_FILE"

    cat "$SUMMARY_FILE"
    print_success "Summary saved to: $SUMMARY_FILE"
}

generate_docs() {
    print_header "5. Generating API Documentation"

    if check_command redocly; then
        print_info "Generating HTML documentation with Redocly..."
        OUTPUT_FILE="$DOCS_DIR/api-documentation-$TIMESTAMP.html"

        if redocly build-docs "$OPENAPI_FILE" --output "$OUTPUT_FILE" 2>&1; then
            print_success "Documentation generated: $OUTPUT_FILE"

            # Create symlink to latest
            ln -sf "$(basename "$OUTPUT_FILE")" "$DOCS_DIR/api-documentation-latest.html"
            print_info "Latest docs: $DOCS_DIR/api-documentation-latest.html"
        else
            print_error "Failed to generate documentation"
        fi
    else
        print_warning "Redocly CLI not installed. Cannot generate docs."
        print_info "Install with: npm install -g @redocly/cli"
    fi
}

##############################################################################
# Main Script
##############################################################################

main() {
    cd "$PROJECT_ROOT"

    print_header "OpenAPI Validation Script"
    print_info "OpenAPI File: $OPENAPI_FILE"
    print_info "Reports Directory: $REPORT_DIR"

    # Check if --install flag is passed
    if [[ "$1" == "--install" ]]; then
        install_tools
        echo ""
        print_info "Re-run this script without --install to validate"
        exit 0
    fi

    # Check if openapi.yml exists
    if [ ! -f "$OPENAPI_FILE" ]; then
        print_error "OpenAPI file not found: $OPENAPI_FILE"
        exit 1
    fi

    # Run validations
    VALIDATION_FAILED=0

    validate_yaml_syntax || VALIDATION_FAILED=1
    validate_with_spectral || VALIDATION_FAILED=1
    validate_with_swagger || VALIDATION_FAILED=1
    validate_with_redocly || VALIDATION_FAILED=1

    # Generate summary
    generate_summary

    # Optionally generate docs (even if validation failed)
    if [[ "$2" == "--docs" ]]; then
        generate_docs
    fi

    echo ""
    print_header "Validation Complete"

    if [ $VALIDATION_FAILED -eq 0 ]; then
        print_success "All validations passed!"
        exit 0
    else
        print_error "Some validations failed. Review reports in $REPORT_DIR/"
        exit 1
    fi
}

# Run main with all arguments
main "$@"
