--***********************************************************
--**           The Blind Trait Mod - By Onkeen             **
--***********************************************************

function addBlindTrait()
	local blindTraitforFactory = TraitFactory.addTrait("Blind", "Blind", -18, "Blind", false, false);
	TraitFactory.setMutualExclusive("Blind", "EagleEyed");
	TraitFactory.setMutualExclusive("Blind", "NightVision");
	TraitFactory.setMutualExclusive("Blind", "KeenHearing");
	TraitFactory.setMutualExclusive("Blind", "Illiterate");
	TraitFactory.setMutualExclusive("Blind", "FastReader");
	TraitFactory.setMutualExclusive("Blind", "SlowReader");
	TraitFactory.setMutualExclusive("Blind", "HardOfHearing");
	TraitFactory.setMutualExclusive("Blind", "Deaf");
end

Events.OnGameBoot.Add(addBlindTrait);