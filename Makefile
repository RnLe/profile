# Transfer of git-ignored working material between devices.
#
# These folders are intentionally never committed. To move them:
#
#   make pack        # on the source device -> profile-material.tar.gz
#   (copy the archive to the target device, next to this Makefile)
#   make unpack      # on the target device
#
# The archive itself is git-ignored and must stay that way.

ARCHIVE  := profile-material.tar.gz
PAYLOAD  := AGENTS.md docs documents material thesis

.DEFAULT_GOAL := help
.PHONY: help pack unpack list clean-archive

help: ## Show available targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) \
		| sed -e 's/:.*##/\t/' \
		| awk -F '\t' '{ printf "  %-16s %s\n", $$1, $$2 }'

pack: ## Bundle documents/, material/, and thesis/ into the transfer archive
	@present=""; \
	for d in $(PAYLOAD); do \
		if [ -d "$$d" ]; then present="$$present $$d"; \
		else echo "skipping $$d/ (not present)"; fi; \
	done; \
	if [ -z "$$present" ]; then \
		echo "nothing to pack: none of ($(PAYLOAD)) exist here"; exit 1; \
	fi; \
	rm -f $(ARCHIVE); \
	tar --exclude-vcs -czf $(ARCHIVE) $$present; \
	echo "packed$$present -> $(ARCHIVE) ($$(du -h $(ARCHIVE) | cut -f1))"

unpack: ## Restore the ignored working folders (FORCE=1 to overwrite existing)
	@if [ ! -f $(ARCHIVE) ]; then \
		echo "$(ARCHIVE) not found; copy it next to this Makefile first"; exit 1; \
	fi
	@if [ -z "$(FORCE)" ]; then \
		for d in $(PAYLOAD); do \
			if [ -e "$$d" ]; then \
				echo "refusing to overwrite existing $$d/; remove it, or run: make unpack FORCE=1"; \
				exit 1; \
			fi; \
		done; \
	fi
	@tar -xzf $(ARCHIVE)
	@echo "unpacked $(ARCHIVE):"
	@for d in $(PAYLOAD); do \
		[ -d "$$d" ] && echo "  $$d/ ($$(du -sh $$d | cut -f1))"; \
	done; true

list: ## Show what the transfer archive contains, without extracting
	@if [ ! -f $(ARCHIVE) ]; then echo "$(ARCHIVE) not found"; exit 1; fi
	@tar -tzf $(ARCHIVE) | sed -n '1,40p'
	@echo "..."
	@echo "$$(tar -tzf $(ARCHIVE) | wc -l) entries total"

clean-archive: ## Delete the local transfer archive
	@rm -f $(ARCHIVE) && echo "removed $(ARCHIVE)"
