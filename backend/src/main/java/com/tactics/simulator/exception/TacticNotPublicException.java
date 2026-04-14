package com.tactics.simulator.exception;

import java.util.UUID;

public class TacticNotPublicException extends RuntimeException {

    public TacticNotPublicException(UUID uuid) {
        super("Tactic with uuid " + uuid + " is not public");
    }
}
