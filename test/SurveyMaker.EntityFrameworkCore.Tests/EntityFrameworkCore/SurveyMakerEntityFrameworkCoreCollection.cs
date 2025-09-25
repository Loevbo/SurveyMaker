using Xunit;

namespace SurveyMaker.EntityFrameworkCore;

[CollectionDefinition(SurveyMakerTestConsts.CollectionDefinitionName)]
public class SurveyMakerEntityFrameworkCoreCollection : ICollectionFixture<SurveyMakerEntityFrameworkCoreFixture>
{

}
